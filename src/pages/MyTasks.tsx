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
import { Calendar, Upload, File, CheckCircle2, Clock, User, FileText, Image, Trash2, Download, AlertCircle, Eye, MessageSquare, History, Layers } from "lucide-react";
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
  const [projectFiles, setProjectFiles] = useState<{
    [key: string]: ProjectFile[];
  }>({});
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);
  const fetchUserProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to fetch your projects",
          variant: "destructive"
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
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchProjectFiles = async (projectId: string) => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.storage.from('project-files').list(`${user.id}/${projectId}`, {
        limit: 100
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
        uploaded_at: file.created_at || new Date().toISOString()
      })) || [];
      setProjectFiles(prev => ({
        ...prev,
        [projectId]: files
      }));
    } catch (error) {
      console.error('Error fetching project files:', error);
    }
  };
  const handleFileUpload = async (projectId: string, files: FileList) => {
    if (!user || !files.length) return;
    setUploading(projectId);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${user.id}/${projectId}/${fileName}`;
        const {
          error
        } = await supabase.storage.from('project-files').upload(filePath, file);
        if (error) {
          throw error;
        }
        return fileName;
      });
      await Promise.all(uploadPromises);
      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`
      });

      // Refresh project files
      await fetchProjectFiles(projectId);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };
  const handleDeleteFile = async (projectId: string, fileName: string) => {
    if (!user) return;
    try {
      const {
        error
      } = await supabase.storage.from('project-files').remove([`${user.id}/${projectId}/${fileName}`]);
      if (error) {
        throw error;
      }
      toast({
        title: "Success",
        description: "File deleted successfully"
      });

      // Refresh project files
      await fetchProjectFiles(projectId);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      });
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "project initiation":
        return "bg-gray-100 text-gray-800";
      case "design development":
        return "bg-blue-100 text-blue-800";
      case "prototyping":
        return "bg-purple-100 text-purple-800";
      case "testing & refinement":
        return "bg-yellow-100 text-yellow-800";
      case "production":
        return "bg-orange-100 text-orange-800";
      case "delivering":
        return "bg-cyan-100 text-cyan-800";
      case "complete":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusProgress = (status: string) => {
    switch (status) {
      case "project initiation":
        return 10;
      case "design development":
        return 30;
      case "prototyping":
        return 50;
      case "testing & refinement":
        return 70;
      case "production":
        return 85;
      case "delivering":
        return 95;
      case "complete":
        return 100;
      default:
        return 0;
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
    return <main className="flex-1 p-6 bg-background overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your tasks...</p>
            </div>
          </div>
        </div>
      </main>;
  }
  return <main className="flex-1 p-6 bg-background overflow-y-auto">
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
            {incompleteProjects.length === 0 ? <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No active projects</h3>
                  <p className="text-sm">You don't have any active projects at the moment.</p>
                </div>
              </Card> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {incompleteProjects.map(project => <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
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
                                <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedProject(project)}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Project Details - {project.name}</DialogTitle>
                                  <DialogDescription>
                                    View project files, design versions, and client feedback
                                  </DialogDescription>
                                </DialogHeader>
                                <Tabs defaultValue="versions" className="w-full">
                                  <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="versions">
                                      <History className="h-4 w-4 mr-2" />
                                      Design Versions
                                    </TabsTrigger>
                                    <TabsTrigger value="annotations">
                                      <Layers className="h-4 w-4 mr-2" />
                                      Client Annotations
                                    </TabsTrigger>
                                    <TabsTrigger value="feedback">
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      Client Feedback
                                    </TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="versions" className="space-y-4 mt-4">
                                    <div className="space-y-3">
                                      <h4 className="font-medium">Design Version History</h4>
                                      <div className="space-y-3">
                                        {/* Mock design versions */}
                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                v3
                                              </div>
                                              <div>
                                                <div className="font-medium">Latest Version</div>
                                                <div className="text-sm text-muted-foreground">Updated 2 hours ago</div>
                                              </div>
                                            </div>
                                            <Badge className="bg-green-100 text-green-800">Current</Badge>
                                          </div>
                                          <div className="text-sm text-muted-foreground mb-3">
                                            Updated color scheme and typography based on client feedback
                                          </div>
                                          <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Design
                                          </Button>
                                        </div>

                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                                                v2
                                              </div>
                                              <div>
                                                <div className="font-medium">Previous Version</div>
                                                <div className="text-sm text-muted-foreground">Updated 1 day ago</div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-sm text-muted-foreground mb-3">
                                            Initial design with basic layout and structure
                                          </div>
                                          <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Design
                                          </Button>
                                        </div>

                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                                                v1
                                              </div>
                                              <div>
                                                <div className="font-medium">First Draft</div>
                                                <div className="text-sm text-muted-foreground">Updated 3 days ago</div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-sm text-muted-foreground mb-3">
                                            Initial concept and wireframes
                                          </div>
                                          <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Design
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="annotations" className="space-y-4 mt-4">
                                    <div className="space-y-3">
                                      <h4 className="font-medium">Client Annotations</h4>
                                      <div className="space-y-3">
                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <Avatar className="w-8 h-8">
                                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                                {getInitials(project.client)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{project.client}</span>
                                                <span className="text-xs text-muted-foreground">2 hours ago</span>
                                              </div>
                                              <div className="text-sm text-muted-foreground mb-2">
                                                Annotation on Header Section
                                              </div>
                                              <div className="text-sm">
                                                "The header looks great! Can we make the logo slightly larger and adjust the navigation spacing?"
                                              </div>
                                              <div className="mt-2">
                                                <Badge variant="outline" className="text-xs">Design v3</Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <Avatar className="w-8 h-8">
                                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                                {getInitials(project.client)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{project.client}</span>
                                                <span className="text-xs text-muted-foreground">1 day ago</span>
                                              </div>
                                              <div className="text-sm text-muted-foreground mb-2">
                                                Annotation on Color Palette
                                              </div>
                                              <div className="text-sm">
                                                "Love the color scheme! The blue works perfectly with our brand guidelines."
                                              </div>
                                              <div className="mt-2">
                                                <Badge variant="outline" className="text-xs">Design v2</Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="feedback" className="space-y-4 mt-4">
                                    <div className="space-y-3">
                                      <h4 className="font-medium">Client Feedback</h4>
                                      <div className="space-y-4">
                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <Avatar className="w-8 h-8">
                                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                                {getInitials(project.client)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium">{project.client}</span>
                                                <span className="text-sm text-muted-foreground">3 hours ago</span>
                                              </div>
                                              <div className="text-sm mb-3">
                                                "The latest design iteration looks fantastic! I'm particularly impressed with the user experience flow and the attention to detail in the interface elements. The color palette aligns perfectly with our brand identity."
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge className="bg-green-100 text-green-800">Approved</Badge>
                                                <Badge variant="outline" className="text-xs">Design v3</Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <Avatar className="w-8 h-8">
                                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                                {getInitials(project.client)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium">{project.client}</span>
                                                <span className="text-sm text-muted-foreground">2 days ago</span>
                                              </div>
                                              <div className="text-sm mb-3">
                                                "Good progress on the design! A few suggestions: 1) Can we adjust the typography for better readability? 2) The navigation could be more prominent. 3) Consider adding more whitespace in the content areas."
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge className="bg-yellow-100 text-yellow-800">Revision Requested</Badge>
                                                <Badge variant="outline" className="text-xs">Design v2</Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="border rounded-lg p-4">
                                          <div className="flex items-start gap-3">
                                            <Avatar className="w-8 h-8">
                                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                                {getInitials(project.client)}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="font-medium">{project.client}</span>
                                                <span className="text-sm text-muted-foreground">4 days ago</span>
                                              </div>
                                              <div className="text-sm mb-3">
                                                "Thank you for the initial design concepts. The overall direction looks promising. We'd like to see some variations in the layout and explore different color options for the primary elements."
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-100 text-blue-800">Initial Review</Badge>
                                                <Badge variant="outline" className="text-xs">Design v1</Badge>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>

                            <div className="space-x-2">
                              
                              
                              <label htmlFor={`upload-${project.id}`}>
                                <Button variant="outline" size="sm" asChild>
                                  <span>
                                    <Upload className="h-4 w-4 mr-1" />
                                    Upload
                                  </span>
                                </Button>
                              </label>
                              <input id={`upload-${project.id}`} type="file" multiple accept="image/*,.pdf,.doc,.docx,.zip" className="hidden" onChange={e => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            console.log(`Uploading ${files.length} file(s) for project ${project.name}`);
                            // TODO: Implement file upload logic
                          }
                        }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            {completedProjects.length === 0 ? <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No completed projects</h3>
                  <p className="text-sm">You haven't completed any projects yet.</p>
                </div>
              </Card> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedProjects.map(project => <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
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

                          <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedProject(project)}>
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>)}
              </div>}
          </TabsContent>
        </Tabs>
      </div>
    </main>;
};
export default MyTasks;