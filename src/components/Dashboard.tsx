import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Upload, File, Share, Download, Trash2, Lock, Eye, Copy, LogOut, User, Plus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

// Types
interface FileData {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
}

interface SharedLink {
  id: string;
  file_id: string;
  share_token: string;
  has_password: boolean;
  expires_at: string | null;
  created_at: string;
  accessed_count: number;
}

// Validation schemas
const passwordSchema = z.string().min(4, "Password must be at least 4 characters").max(50, "Password must be less than 50 characters");

const Dashboard = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [sharePassword, setSharePassword] = useState("");
  const [shareWithPassword, setShareWithPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      } else {
        fetchFiles();
        fetchSharedLinks();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive"
      });
    }
  };

  const fetchSharedLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedLinks(data || []);
    } catch (error) {
      console.error('Error fetching shared links:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('files')
        .insert({
          user_id: user.id,
          filename: fileName,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filePath
        });

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: `${file.name} uploaded successfully`
      });

      fetchFiles();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (file: FileData) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: `${file.original_filename} deleted successfully`
      });

      fetchFiles();
      fetchSharedLinks();
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const handleShareFile = (file: FileData) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
    setSharePassword("");
    setShareWithPassword(false);
    setPasswordError("");
  };

  const generateShareLink = async () => {
    if (!selectedFile || !user) return;

    try {
      // Validate password if required
      if (shareWithPassword) {
        try {
          passwordSchema.parse(sharePassword);
          setPasswordError("");
        } catch (error) {
          if (error instanceof z.ZodError) {
            setPasswordError(error.issues[0].message);
            return;
          }
        }
      }

      // Generate unique share token
      const shareToken = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      // Hash password if provided
      let passwordHash = null;
      if (shareWithPassword && sharePassword) {
        // Simple hash - in production, use proper hashing
        passwordHash = btoa(sharePassword);
      }

      // Create shared link
      const { error } = await supabase
        .from('shared_links')
        .insert({
          file_id: selectedFile.id,
          user_id: user.id,
          share_token: shareToken,
          password_hash: passwordHash,
          has_password: shareWithPassword
        });

      if (error) throw error;

      // Copy link to clipboard
      const shareLink = `${window.location.origin}/share/${shareToken}`;
      navigator.clipboard.writeText(shareLink);

      toast({
        title: "Share Link Generated!",
        description: "Link copied to clipboard"
      });

      setShareDialogOpen(false);
      fetchSharedLinks();
    } catch (error: any) {
      console.error('Error generating share link:', error);
      toast({
        title: "Share Failed",
        description: error.message || "Failed to generate share link",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (file: FileData) => {
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(file.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Logout Failed",
        description: error.message || "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    return <File className="w-8 h-8 text-cloud-light" />;
  };

  const getSharedLinkForFile = (fileId: string) => {
    return sharedLinks.find(link => link.file_id === fileId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <header className="border-b bg-glass backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cloud-gradient rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold">CloudStore</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="text-sm">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Upload any file format to your secure cloud storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                  <p className="text-sm text-muted-foreground mb-4">Support any file format, up to 20MB</p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="*/*"
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploading ? "Uploading..." : "Choose Files"}
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="w-5 h-5" />
                  My Files ({files.length})
                </CardTitle>
                <CardDescription>
                  Manage your uploaded files and generate share links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((file) => {
                    const sharedLink = getSharedLinkForFile(file.id);
                    return (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-glass rounded-lg border">
                        <div className="flex items-center gap-4">
                          {getFileIcon(file.mime_type)}
                          <div>
                            <h3 className="font-medium">{file.original_filename}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.file_size)} • Uploaded {new Date(file.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {sharedLink && (
                            <Badge variant="secondary" className="gap-1">
                              <Share className="w-3 h-3" />
                              Shared
                              {sharedLink.has_password && <Lock className="w-3 h-3" />}
                            </Badge>
                          )}
                          
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          <Button variant="ghost" size="sm" onClick={() => handleShareFile(file)}>
                            <Share className="w-4 h-4" />
                          </Button>
                          
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(file)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {files.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No files uploaded yet</p>
                      <p className="text-sm">Upload your first file to get started</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              Generate a shareable link for "{selectedFile?.original_filename}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="password-protect"
                checked={shareWithPassword}
                onCheckedChange={setShareWithPassword}
              />
              <Label htmlFor="password-protect">Password protect this link</Label>
            </div>
            
            {shareWithPassword && (
              <div className="space-y-2">
                <Label htmlFor="share-password">Password</Label>
                <Input
                  id="share-password"
                  type="password"
                  placeholder="Enter password for shared link (min 4 characters)"
                  value={sharePassword}
                  onChange={(e) => {
                    setSharePassword(e.target.value);
                    setPasswordError("");
                  }}
                />
                {passwordError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </p>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={generateShareLink}>
                Generate Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;