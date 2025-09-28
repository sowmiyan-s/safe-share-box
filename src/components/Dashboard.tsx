import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  Files, 
  Share, 
  Lock, 
  Download, 
  Trash2,
  Search,
  Plus,
  Link,
  Eye,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "presentation.pdf",
      size: "2.4 MB",
      uploadDate: "2024-01-15",
      type: "PDF",
      isPasswordProtected: true
    },
    {
      id: 2,
      name: "vacation-photos.zip",
      size: "15.7 MB",
      uploadDate: "2024-01-14",
      type: "ZIP",
      isPasswordProtected: false
    },
    {
      id: 3,
      name: "report.docx",
      size: "856 KB",
      uploadDate: "2024-01-13",
      type: "DOC",
      isPasswordProtected: true
    }
  ]);
  
  const [shareFile, setShareFile] = useState(null);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    // This will be connected to Supabase storage
    toast({
      title: "Files uploaded successfully!",
      description: `${uploadedFiles.length} file(s) uploaded to your cloud storage.`,
    });
  };

  const generateShareLink = (fileId: number) => {
    const shareUrl = `${window.location.origin}/share/${fileId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Share link copied!",
      description: "The shareable link has been copied to your clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <header className="bg-glass backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">CloudStore Dashboard</h1>
            <Button variant="ghost" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        <Card className="mb-8 shadow-soft border-0 bg-glass backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-cloud-gradient rounded-2xl">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold">Upload Your Files</h2>
              <p className="text-muted-foreground max-w-md">
                Drag and drop files here or click to browse. All formats supported.
              </p>
              <div className="flex gap-4">
                <label htmlFor="file-upload">
                  <Button variant="hero" size="lg" className="cursor-pointer">
                    <Plus className="w-5 h-5 mr-2" />
                    Choose Files
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Your Files</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search files..." 
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <Card key={file.id} className="shadow-soft border-0 bg-glass backdrop-blur-sm hover:shadow-glow transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Files className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm truncate max-w-32">{file.name}</h3>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                      </div>
                    </div>
                    {file.isPasswordProtected && (
                      <Lock className="w-4 h-4 text-accent" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {file.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {file.uploadDate}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Share className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-glass backdrop-blur-sm border-0">
                        <DialogHeader>
                          <DialogTitle>Share File</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label htmlFor="share-password">Password Protection (Optional)</Label>
                            <Input
                              id="share-password"
                              type="password"
                              placeholder="Enter password to protect this file"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="hero" 
                              className="flex-1"
                              onClick={() => generateShareLink(file.id)}
                            >
                              <Link className="w-4 h-4 mr-2" />
                              Generate Link
                            </Button>
                            <Button variant="outline" size="icon">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;