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
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Upload, File, CheckCircle2, Clock, User, FileText, Image, Trash2, Download, AlertCircle, Eye, MessageSquare, History, Layers, Star, MapPin, Plus } from "lucide-react";
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
  designer?: string;
}

interface Design {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface DesignVersion {
  id: string;
  project_id: string;
  version_number: number;
  name: string;
  description: string | null;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface VersionFile {
  id: string;
  version_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
  user_id: string;
}

interface Annotation {
  id: string;
  version_id: string;
  file_id: string;
  x_position: number;
  y_position: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface Feedback {
  id: string;
  version_id: string;
  content: string;
  rating: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const MyTasks = () => {
  // Force recompile - removing projectFiles references
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [projectDesigns, setProjectDesigns] = useState<{ [key: string]: Design[] }>({});
  const [designVersions, setDesignVersions] = useState<DesignVersion[]>([]);
  const [projectDesignVersions, setProjectDesignVersions] = useState<{ [key: string]: DesignVersion[] }>({});
  const [versionFiles, setVersionFiles] = useState<{ [key: string]: VersionFile[] }>({});
  const [annotations, setAnnotations] = useState<{ [key: string]: Annotation[] }>({});
  const [feedback, setFeedback] = useState<{ [key: string]: Feedback[] }>({});
  const [selectedVersion, setSelectedVersion] = useState<DesignVersion | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [newFeedback, setNewFeedback] = useState("");
  const [newRating, setNewRating] = useState<number>(5);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showUploadDraftDialog, setShowUploadDraftDialog] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);
  const [uploadDesignId, setUploadDesignId] = useState<string | null>(null);
  const [uploadDesignName, setUploadDesignName] = useState("");
  const [uploadDesignDescription, setUploadDesignDescription] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      fetchUserProjects();
    }
  }, [user]);

  useEffect(() => {
    if (projects.length > 0) {
      fetchAllProjectDesigns();
      fetchAllProjectDesignVersions();
    }
  }, [projects]);
  const fetchUserProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Bypass TypeScript issues by using any and manual query building
      const supabaseClient: any = supabase;
      const result = await supabaseClient
        .from('projects')
        .select('*')
        .eq('designer', user.email)
        .order('created_at', { ascending: false });
      
      if (result.error) {
        console.error('Error fetching projects:', result.error);
        toast({
          title: "Error",
          description: "Failed to fetch your projects",
          variant: "destructive"
        });
        return;
      }
      setProjects(result.data || []);
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

  // Fetch all designs for all projects
  const fetchAllProjectDesigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching designs:', error);
        return;
      }
      
      // Group designs by project_id
      const designsByProject: { [key: string]: Design[] } = {};
      data?.forEach(design => {
        if (!designsByProject[design.project_id]) {
          designsByProject[design.project_id] = [];
        }
        designsByProject[design.project_id].push(design);
      });
      
      setProjectDesigns(designsByProject);
    } catch (error) {
      console.error('Error fetching designs:', error);
    }
  };

  // Fetch all design versions for all projects
  const fetchAllProjectDesignVersions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('design_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching design versions:', error);
        return;
      }
      
      // Group design versions by project_id
      const versionsByProject: { [key: string]: DesignVersion[] } = {};
      data?.forEach(version => {
        if (!versionsByProject[version.project_id]) {
          versionsByProject[version.project_id] = [];
        }
        versionsByProject[version.project_id].push(version);
      });
      
      setProjectDesignVersions(versionsByProject);
    } catch (error) {
      console.error('Error fetching design versions:', error);
    }
  };
  // Fetch design versions for a project
  const fetchDesignVersions = async (projectId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('design_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });
      
      if (error) {
        console.error('Error fetching design versions:', error);
        return;
      }
      
      setDesignVersions(data || []);
    } catch (error) {
      console.error('Error fetching design versions:', error);
    }
  };

  // Create initial version when opening project details
  const handleViewProject = async (project: Project) => {
    setSelectedProject(project);
    await fetchDesignVersions(project.id);
  };

  // Handle upload button click - for creating new design
  const handleUploadClick = (projectId: string) => {
    setUploadProjectId(projectId);
    setShowUploadDialog(true);
    setUploadDesignName("");
    setUploadDesignDescription("");
  };

  // Handle upload draft button click - for uploading to existing design
  const handleUploadDraftClick = (designId: string) => {
    const design = designs.find(d => d.id === designId);
    setSelectedDesign(design || null);
    setUploadDesignId(designId);
    setShowUploadDraftDialog(true);
  };

  // Handle design upload
  const handleUploadDesign = async (files: FileList | null) => {
    if (!files || !uploadProjectId || !user || !uploadDesignName.trim()) {
      toast({
        title: "Error",
        description: "Please provide design name and select files to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(uploadProjectId);

      // Get next version number for this project
      const existingVersions = projectDesignVersions[uploadProjectId] || [];
      const nextVersionNumber = existingVersions.length > 0 
        ? Math.max(...existingVersions.map(v => v.version_number)) + 1 
        : 1;

      // Create new design version entry
      const { data: versionData, error: versionError } = await supabase
        .from('design_versions')
        .insert({
          project_id: uploadProjectId,
          name: uploadDesignName.trim(),
          description: uploadDesignDescription.trim() || null,
          version_number: nextVersionNumber,
          is_latest: true,
          user_id: user.id
        })
        .select()
        .single();

      if (versionError) {
        console.error('Error creating design version:', versionError);
        toast({
          title: "Error",
          description: "Failed to create design version",
          variant: "destructive"
        });
        return;
      }

      // Update previous versions to not be latest
      if (existingVersions.length > 0) {
        await supabase
          .from('design_versions')
          .update({ is_latest: false })
          .eq('project_id', uploadProjectId)
          .neq('id', versionData.id);
      }

      // Upload files to storage
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${uploadProjectId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        // Create version file record
        return await supabase
          .from('version_files')
          .insert({
            version_id: versionData.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            user_id: user.id
          });
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success",
        description: `Uploaded design version "${uploadDesignName}" with ${files.length} files`,
      });

      // Refresh data
      await fetchAllProjectDesigns();
      await fetchAllProjectDesignVersions();
      
      // Close dialog and reset state
      setShowUploadDialog(false);
      setUploadProjectId(null);
      setUploadDesignName("");
      setUploadDesignDescription("");

    } catch (error) {
      console.error('Error uploading design:', error);
      toast({
        title: "Error",
        description: "Failed to upload design files",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  // Handle design draft upload
  const handleUploadDraft = async (files: FileList | null) => {
    if (!files || !uploadDesignId || !user) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(uploadDesignId);

      // Find the design to get its info
      const design = designs.find(d => d.id === uploadDesignId);
      if (!design) {
        toast({
          title: "Error",
          description: "Design not found",
          variant: "destructive"
        });
        return;
      }

      // Get next version number for this design/project
      const existingVersions = projectDesignVersions[design.project_id] || [];
      const nextVersionNumber = existingVersions.length > 0 
        ? Math.max(...existingVersions.map(v => v.version_number)) + 1 
        : 1;

      // Create new design version entry using design's name and description
      const { data: versionData, error: versionError } = await supabase
        .from('design_versions')
        .insert({
          project_id: design.project_id,
          name: design.name, // Use design's name
          description: design.description, // Use design's description
          version_number: nextVersionNumber,
          is_latest: true,
          user_id: user.id
        })
        .select()
        .single();

      if (versionError) {
        console.error('Error creating design version:', versionError);
        toast({
          title: "Error",
          description: "Failed to create design version",
          variant: "destructive"
        });
        return;
      }

      // Update previous versions to not be latest
      if (existingVersions.length > 0) {
        await supabase
          .from('design_versions')
          .update({ is_latest: false })
          .eq('project_id', design.project_id)
          .neq('id', versionData.id);
      }

      // Upload files to storage
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${design.project_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        // Create version file record
        return await supabase
          .from('version_files')
          .insert({
            version_id: versionData.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
            user_id: user.id
          });
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success",
        description: `Uploaded draft for design "${design.name}" with ${files.length} files`,
      });

      // Refresh data
      await fetchAllProjectDesignVersions();
      
      // Close dialog and reset state
      setShowUploadDraftDialog(false);
      setUploadDesignId(null);

    } catch (error) {
      console.error('Error uploading draft:', error);
      toast({
        title: "Error",
        description: "Failed to upload draft files",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
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
                              <span className="text-sm font-medium">Designs</span>
                               <span className="text-sm text-muted-foreground">
                                 {projectDesigns[project.id]?.length || 0} designs
                               </span>
                             </div>
                             
                             {/* Show existing designs */}
                             {projectDesigns[project.id] && projectDesigns[project.id].length > 0 && (
                               <div className="space-y-1 max-h-32 overflow-y-auto">
                                 {projectDesigns[project.id].slice(0, 3).map(design => (
                                   <div key={design.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                                     <div>
                                       <span className="font-medium">{design.name}</span>
                                       {design.description && (
                                         <span className="text-muted-foreground block truncate max-w-[120px]">
                                           {design.description}
                                         </span>
                                       )}
                                     </div>
                                     <Button 
                                       variant="ghost" 
                                       size="sm" 
                                       className="h-6 px-2"
                                       onClick={() => handleUploadDraftClick(design.id)}
                                       disabled={uploading === design.id}
                                     >
                                       <Upload className="h-3 w-3" />
                                     </Button>
                                   </div>
                                 ))}
                                 {projectDesigns[project.id].length > 3 && (
                                   <div className="text-xs text-muted-foreground text-center">
                                     +{projectDesigns[project.id].length - 3} more designs
                                   </div>
                                 )}
                               </div>
                             )}

                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewProject(project)}>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Design
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
                                   <TabsList className="grid w-full grid-cols-2">
                                     <TabsTrigger value="versions">
                                       <History className="h-4 w-4 mr-2" />
                                       Design Versions
                                     </TabsTrigger>
                                     <TabsTrigger value="feedback">
                                       <MessageSquare className="h-4 w-4 mr-2" />
                                       Client Feedback
                                     </TabsTrigger>
                                   </TabsList>

                                  <TabsContent value="versions" className="space-y-4 mt-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Design Version History</h4>
                                        <Button size="sm" className="flex items-center gap-2">
                                          <Plus className="h-4 w-4" />
                                          Create New Version
                                        </Button>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        {/* Latest Version with Upload */}
                                        <div className="border rounded-lg p-4 bg-green-50">
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
                                          
                                          {/* Upload Section for Latest Version */}
                                          <div className="space-y-3 mb-4">
                                            <div>
                                              <Label htmlFor="version-upload" className="text-sm font-medium">Upload Design Files</Label>
                                              <Input 
                                                id="version-upload" 
                                                type="file" 
                                                multiple 
                                                accept="image/*,.pdf,.fig,.sketch"
                                                className="mt-2"
                                                disabled={uploading === 'version-3'}
                                              />
                                            </div>
                                            {uploading === 'version-3' && (
                                              <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                  Uploading files... Please wait.
                                                </AlertDescription>
                                              </Alert>
                                            )}
                                          </div>
                                          
                                          {/* Sample uploaded files */}
                                          <div className="space-y-2 mb-3">
                                            <div className="text-sm font-medium">Uploaded Files (3)</div>
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                <div className="flex items-center gap-2">
                                                  <Image className="h-4 w-4 text-blue-500" />
                                                  <span className="text-sm">homepage-design-v3.png</span>
                                                  <span className="text-xs text-muted-foreground">(2.4 MB)</span>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                  <Download className="h-4 w-4" />
                                                </Button>
                                              </div>
                                              <div className="flex items-center justify-between p-2 bg-white rounded border">
                                                <div className="flex items-center gap-2">
                                                  <File className="h-4 w-4 text-purple-500" />
                                                  <span className="text-sm">style-guide.pdf</span>
                                                  <span className="text-xs text-muted-foreground">(1.8 MB)</span>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                  <Download className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Design
                                          </Button>
                                        </div>

                                        {/* Previous Versions (Read-only) */}
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
                                          <div className="space-y-2 mb-3">
                                            <div className="text-sm font-medium">Files (2)</div>
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                                <div className="flex items-center gap-2">
                                                  <Image className="h-4 w-4 text-blue-500" />
                                                  <span className="text-sm">homepage-v2.png</span>
                                                  <span className="text-xs text-muted-foreground">(1.9 MB)</span>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                  <Download className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
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
                                          <div className="space-y-2 mb-3">
                                            <div className="text-sm font-medium">Files (1)</div>
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                                                <div className="flex items-center gap-2">
                                                  <File className="h-4 w-4 text-gray-500" />
                                                  <span className="text-sm">wireframes-v1.pdf</span>
                                                  <span className="text-xs text-muted-foreground">(0.8 MB)</span>
                                                </div>
                                                <Button variant="outline" size="sm">
                                                  <Download className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                          <Button variant="outline" size="sm">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Design
                                          </Button>
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
                               View project details
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

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Design</DialogTitle>
              <DialogDescription>
                Upload design files for this project
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="design-name">Design Name *</Label>
                <Input
                  id="design-name"
                  type="text"
                  value={uploadDesignName}
                  onChange={(e) => setUploadDesignName(e.target.value)}
                  placeholder="Enter design name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="design-description">Design Description</Label>
                <Textarea
                  id="design-description"
                  value={uploadDesignDescription}
                  onChange={(e) => setUploadDesignDescription(e.target.value)}
                  placeholder="Enter design description (optional)"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="design-files">Design Files *</Label>
                <Input
                  id="design-files"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.fig,.sketch,.psd,.ai"
                  onChange={(e) => handleUploadDesign(e.target.files)}
                  className="mt-1"
                  disabled={uploading === uploadProjectId}
                />
              </div>
              
              {uploading === uploadProjectId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Uploading design files... Please wait.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Upload Draft Dialog */}
        <Dialog open={showUploadDraftDialog} onOpenChange={setShowUploadDraftDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Draft</DialogTitle>
              <DialogDescription>
                Upload draft files for existing design
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedDesign && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">{selectedDesign.name}</div>
                  {selectedDesign.description && (
                    <div className="text-sm text-muted-foreground">{selectedDesign.description}</div>
                  )}
                </div>
              )}
              
              <div>
                <Label htmlFor="draft-files">Draft Files *</Label>
                <Input
                  id="draft-files"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.fig,.sketch,.psd,.ai"
                  onChange={(e) => handleUploadDraft(e.target.files)}
                  className="mt-1"
                  disabled={uploading === uploadDesignId}
                />
              </div>
              
              {uploading === uploadDesignId && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Uploading draft files... Please wait.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>;
};
export default MyTasks;