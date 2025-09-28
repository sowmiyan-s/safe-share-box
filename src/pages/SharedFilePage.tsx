import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Cloud, Lock, Download, AlertCircle, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface SharedLink {
  id: string;
  file_id: string;
  share_token: string;
  has_password: boolean;
  password_hash: string | null;
  expires_at: string | null;
  created_at: string;
  accessed_count: number;
}

interface FileData {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}

const passwordSchema = z.string().min(1, "Password is required");

const SharedFilePage = () => {
  const { token } = useParams<{ token: string }>();
  const [sharedLink, setSharedLink] = useState<SharedLink | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchSharedFile();
    }
  }, [token]);

  const fetchSharedFile = async () => {
    try {
      // Fetch shared link info
      const { data: linkData, error: linkError } = await supabase
        .from('shared_links')
        .select('*')
        .eq('share_token', token)
        .single();

      if (linkError) throw linkError;

      if (!linkData) {
        toast({
          title: "File Not Found",
          description: "This shared link does not exist or has expired.",
          variant: "destructive"
        });
        return;
      }

      setSharedLink(linkData);

      // Fetch file data
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('*')
        .eq('id', linkData.file_id)
        .single();

      if (fileError) throw fileError;
      setFileData(fileData);

      // Check if password is required
      if (linkData.has_password) {
        setShowPasswordDialog(true);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Error fetching shared file:', error);
      toast({
        title: "Error",
        description: "Failed to load shared file",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    try {
      passwordSchema.parse(password);

      if (!sharedLink) return;

      // Simple password verification (in production, use proper hashing)
      const expectedHash = sharedLink.password_hash;
      const providedHash = btoa(password);

      if (expectedHash === providedHash) {
        setIsAuthenticated(true);
        setShowPasswordDialog(false);
        
        // Increment access count
        await supabase
          .from('shared_links')
          .update({ accessed_count: sharedLink.accessed_count + 1 })
          .eq('id', sharedLink.id);
      } else {
        setPasswordError("Incorrect password");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setPasswordError(error.issues[0].message);
      }
    }
  };

  const handleDownload = async () => {
    if (!fileData || !isAuthenticated) return;

    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('user-files')
        .download(fileData.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileData.original_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${fileData.original_filename}`
      });
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download file",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sharedLink || !fileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hero-gradient">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>File Not Found</CardTitle>
            <CardDescription>
              This shared link does not exist or has expired
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-gradient">
      <header className="border-b bg-glass backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-cloud-gradient rounded-lg flex items-center justify-center">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">CloudStore</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-glow border-0 bg-glass backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-cloud-gradient rounded-2xl flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <CardTitle>Shared File</CardTitle>
            <CardDescription>
              {sharedLink.has_password ? "Password protected file" : "Public file"}
            </CardDescription>
          </CardHeader>

          {isAuthenticated && (
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{fileData.original_filename}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(fileData.file_size)} • Shared {new Date(sharedLink.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Accessed {sharedLink.accessed_count} times
                </p>
              </div>

              <Button 
                onClick={handleDownload} 
                className="w-full" 
                variant="hero"
                disabled={downloading}
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? "Downloading..." : "Download File"}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 bg-cloud-gradient rounded-xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-center">Password Required</DialogTitle>
            <DialogDescription className="text-center">
              This file is password protected. Please enter the password to access it.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                required
              />
              {passwordError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full" variant="hero">
              <Lock className="w-4 h-4 mr-2" />
              Access File
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedFilePage;