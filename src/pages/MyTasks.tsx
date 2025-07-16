import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Upload, 
  File, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText,
  Image,
  Trash2,
  Download,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  client: string;
  description: string | null;
  due_date: string;
  status: string;
  type: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_at: string;
}

const MyTasks = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<{ [key: string]: ProjectFile[] }>({});
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your projects",
          variant: "destructive",
        });
        return;
      }

      setProjects(data || []);
      
      // Fetch files for each project
      for (const project of data || []) {
        await fetchProjectFiles(project.id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFiles = async (projectId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .list(`${user.id}/${projectId}`, {
          limit: 100,
        });

      if (error) {
        console.error('Error fetching project files:', error);
        return;
      }

      const files: ProjectFile[] = data?.map(file => ({
        id: file.id,
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        url: `${supabase.storage.from('project-files').getPublicUrl(`${user.id}/${projectId}/${file.name}`).data.publicUrl}`,
        uploaded_at: file.created_at || new Date().toISOString(),
      })) || [];

      setProjectFiles(prev => ({ ...prev, [projectId]: files }));
    } catch (error) {
      console.error('Error fetching project files:', error);
    }
  };

  const handleFileUpload = async (projectId: string, files: FileList) => {
    if (!user || !files.length) return;

    setUploading(projectId);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${projectId}/${fileName}`;

        const { error } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        return fileName;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      });

      // Refresh project files
      await fetchProjectFiles(projectId);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteFile = async (projectId: string, fileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from('project-files')
        .remove([`${user.id}/${projectId}/${fileName}`]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      // Refresh project files
      await fetchProjectFiles(projectId);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "project initiation": return "bg-gray-100 text-gray-800";
      case "design development": return "bg-blue-100 text-blue-800";
      case "prototyping": return "bg-purple-100 text-purple-800";
      case "testing & refinement": return "bg-yellow-100 text-yellow-800";
      case "production": return "bg-orange-100 text-orange-800";
      case "delivering": return "bg-cyan-100 text-cyan-800";
      case "complete": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case "project initiation": return 10;
      case "design development": return 30;
      case "prototyping": return 50;
      case "testing & refinement": return 70;
      case "production": return 85;
      case "delivering": return 95;
      case "complete": return 100;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const incompleteProjects = projects.filter(p => p.status !== 'complete' && p.status !== 'project initiation');
  const completedProjects = projects.filter(p => p.status === 'complete');

  if (loading) {
    return (
      <main className="flex-1 p-6 bg-background overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your tasks...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Tasks</h1>
          <p className="text-muted-foreground">
            Manage your assigned projects and track your progress.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {incompleteProjects.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {completedProjects.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {projects.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </div>
                <User className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Projects ({incompleteProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed Projects ({completedProjects.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {incompleteProjects.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No active projects</h3>
                  <p className="text-sm">You don't have any active projects at the moment.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {incompleteProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1 line-clamp-1">
                            {project.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-4 w-4" />
                            {project.client}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {project.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {getStatusProgress(project.status)}%
                            </span>
                          </div>
                          <Progress value={getStatusProgress(project.status)} className="h-2" />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(project.due_date)}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Files</span>
                            <span className="text-sm text-muted-foreground">
                              {projectFiles[project.id]?.length || 0} uploaded
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => setSelectedProject(project)}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                  <DialogTitle>Upload Files - {project.name}</DialogTitle>
                                  <DialogDescription>
                                    Upload project files, designs, or documents
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="file-upload">Select Files</Label>
                                    <Input
                                      id="file-upload"
                                      type="file"
                                      multiple
                                      onChange={(e) => {
                                        if (e.target.files) {
                                          handleFileUpload(project.id, e.target.files);
                                        }
                                      }}
                                      disabled={uploading === project.id}
                                      className="mt-2"
                                    />
                                  </div>

                                  {uploading === project.id && (
                                    <Alert>
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertDescription>
                                        Uploading files... Please wait.
                                      </AlertDescription>
                                    </Alert>
                                  )}

                                  {projectFiles[project.id] && projectFiles[project.id].length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-2">Uploaded Files</h4>
                                      <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {projectFiles[project.id].map((file) => (
                                          <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                                            <div className="flex items-center gap-2">
                                              <File className="h-4 w-4" />
                                              <div>
                                                <div className="text-sm font-medium">{file.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {formatFileSize(file.size)} • {formatDate(file.uploaded_at)}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => window.open(file.url, '_blank')}
                                              >
                                                <Download className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteFile(project.id, file.name)}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedProjects.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No completed projects</h3>
                  <p className="text-sm">You haven't completed any projects yet.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1 line-clamp-1">
                            {project.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-4 w-4" />
                            {project.client}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 flex-shrink-0">
                          {project.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div>
                          <Badge className={getStatusColor(project.status)}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            {project.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Completed: {formatDate(project.updated_at)}
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Files</span>
                            <span className="text-sm text-muted-foreground">
                              {projectFiles[project.id]?.length || 0} files
                            </span>
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedProject(project)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default MyTasks;