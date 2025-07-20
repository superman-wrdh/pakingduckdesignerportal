import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Calendar, User, FileText, Eye, Plus, Folder, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [designVersions, setDesignVersions] = useState<DesignVersion[]>([]);
  const [versionFiles, setVersionFiles] = useState<{ [key: string]: VersionFile[] }>({});
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'project initiation')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !selectedType || selectedType === "all" || project.type === selectedType;
    const matchesClient = !selectedClient || selectedClient === "all" || project.client === selectedClient;
    
    return matchesSearch && matchesType && matchesClient;
  });

  const uniqueTypes = [...new Set(projects.map(p => p.type))];
  const uniqueClients = [...new Set(projects.map(p => p.client))];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const fetchDesignVersions = async (projectId: string) => {
    try {
      setLoadingDesigns(true);
      const { data: versions, error: versionsError } = await supabase
        .from('design_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (versionsError) {
        console.error('Error fetching design versions:', versionsError);
        toast({
          title: "Error",
          description: "Failed to fetch design versions",
          variant: "destructive",
        });
        return;
      }

      setDesignVersions(versions || []);

      // Fetch files for each version
      if (versions && versions.length > 0) {
        const filesPromises = versions.map(async (version) => {
          const { data: files, error: filesError } = await supabase
            .from('version_files')
            .select('*')
            .eq('version_id', version.id)
            .order('created_at', { ascending: false });

          if (filesError) {
            console.error('Error fetching version files:', filesError);
            return { versionId: version.id, files: [] };
          }

          return { versionId: version.id, files: files || [] };
        });

        const filesResults = await Promise.all(filesPromises);
        const filesMap: { [key: string]: VersionFile[] } = {};
        filesResults.forEach(({ versionId, files }) => {
          filesMap[versionId] = files;
        });
        setVersionFiles(filesMap);
      }
    } catch (error) {
      console.error('Error fetching design versions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch design versions",
        variant: "destructive",
      });
    } finally {
      setLoadingDesigns(false);
    }
  };

  const handleAddToTasks = async (projectId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add projects to your tasks.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'design stage',
          user_id: user.id
        })
        .eq('id', projectId);

      if (error) {
        console.error('Error updating project:', error);
        toast({
          title: "Error",
          description: "Failed to add project to your tasks. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Project has been added to your tasks successfully!",
      });

      // Refresh the projects list to remove the added project
      fetchProjects();
    } catch (error) {
      console.error('Error adding project to tasks:', error);
      toast({
        title: "Error",
        description: "Failed to add project to your tasks. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-6 bg-background overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading marketplace projects...</p>
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Marketplace</h1>
          <p className="text-muted-foreground">
            Discover new design projects in the initiation phase. Connect with clients and showcase your expertise.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {filteredProjects.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Available Projects</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {uniqueClients.length} Clients
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {uniqueTypes.length} Project Types
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, clients, or descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {uniqueClients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-sm">
                {searchTerm || selectedType || selectedClient 
                  ? "Try adjusting your search criteria or filters"
                  : "No projects are currently available in the marketplace"
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
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
                  <CardDescription className="line-clamp-2 mb-4">
                    {project.description || "No description available"}
                  </CardDescription>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {formatDate(project.due_date)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {getInitials(project.client)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{project.client}</div>
                        <div className="text-xs text-muted-foreground">
                          Posted {formatDate(project.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedProject(project);
                            fetchDesignVersions(project.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{project.name}</DialogTitle>
                          <DialogDescription>
                            Project details and design versions
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Tabs defaultValue="details" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Project Details</TabsTrigger>
                            <TabsTrigger value="designs">Design Versions</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-1">Client</h4>
                                <p className="text-sm text-muted-foreground">{project.client}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Type</h4>
                                <Badge variant="secondary">{project.type}</Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-1">Posted</h4>
                                <p className="text-sm text-muted-foreground">{formatDate(project.created_at)}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">Due Date</h4>
                                <p className="text-sm text-muted-foreground">{formatDate(project.due_date)}</p>
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-sm text-muted-foreground mb-4">
                                {project.description || "No description provided"}
                              </p>
                              
                              {/* Design Versions Summary */}
                              {designVersions.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="font-medium mb-2 text-sm">Design Versions ({designVersions.length})</h5>
                                  <div className="space-y-2">
                                    {designVersions.slice(0, 3).map((version) => (
                                      <div key={version.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                        <div className="flex items-center gap-2">
                                          <Folder className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">v{version.version_number}</span>
                                          <span className="text-sm text-muted-foreground">{version.name}</span>
                                          {version.is_latest && (
                                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">Latest</Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {versionFiles[version.id]?.length || 0} files
                                        </div>
                                      </div>
                                    ))}
                                    {designVersions.length > 3 && (
                                      <p className="text-xs text-muted-foreground text-center">
                                        +{designVersions.length - 3} more versions
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-medium mb-2">Status</h4>
                              <Badge variant="outline">{project.status}</Badge>
                            </div>

                            <div className="flex justify-end pt-4">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button className="w-full">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add to My Tasks
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Add Project to Your Tasks</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to add "{project.name}" to your tasks? This will move the project to the design stage and assign it to you.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleAddToTasks(project.id)}>
                                      Add to Tasks
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="designs" className="space-y-4">
                            {loadingDesigns ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                              </div>
                            ) : designVersions.length === 0 ? (
                              <div className="text-center py-8">
                                <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-medium mb-2">No Design Versions</h3>
                                <p className="text-sm text-muted-foreground">
                                  This project doesn't have any design versions yet.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {designVersions.map((version) => (
                                  <Card key={version.id}>
                                    <CardHeader className="pb-3">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <CardTitle className="text-base">
                                            {version.name}
                                            {version.is_latest && (
                                              <Badge variant="default" className="ml-2">Latest</Badge>
                                            )}
                                          </CardTitle>
                                          <div className="text-sm text-muted-foreground">
                                            Version {version.version_number} • {formatDate(version.created_at)}
                                          </div>
                                        </div>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                      {version.description && (
                                        <p className="text-sm text-muted-foreground mb-3">
                                          {version.description}
                                        </p>
                                      )}
                                      
                                      {versionFiles[version.id] && versionFiles[version.id].length > 0 && (
                                        <div>
                                          <h5 className="font-medium mb-2 text-sm">Files ({versionFiles[version.id].length})</h5>
                                          <div className="space-y-2">
                                            {versionFiles[version.id].map((file) => (
                                              <div key={file.id} className="flex items-center gap-2 p-2 border rounded-md">
                                                <Image className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    {file.file_type} • {file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                                  </p>
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => window.open(file.file_url, '_blank')}
                                                >
                                                  <Eye className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Projects;