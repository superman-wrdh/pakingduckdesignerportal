import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Factory, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  BarChart3,
  User,
  UserPlus,
  Eye,
  Edit,
  Plus,
  Search,
  FileText,
  Settings,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  client: string;
  status: string;
  type: string;
  description?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Calculate statistics from real data (excluding project initiation projects)
  const myTaskProjects = projects.filter(p => p.status !== 'project initiation');
  const projectStats = {
    total: myTaskProjects.length,
    inProgress: myTaskProjects.filter(p => p.status !== 'completed').length,
    completed: myTaskProjects.filter(p => p.status === 'completed').length,
    design: myTaskProjects.filter(p => p.status === 'design stage').length,
    manufacturing: myTaskProjects.filter(p => p.status === 'manufacturing').length,
    shipping: myTaskProjects.filter(p => p.status === 'shipping').length
  };

  const completionRate = myTaskProjects.length > 0 
    ? Math.round((projectStats.completed / myTaskProjects.length) * 100)
    : 0;

  const stats = [
    {
      title: "Total Projects",
      value: projectStats.total.toString(),
      change: `${completionRate}% completion rate`,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "In Progress",
      value: projectStats.inProgress.toString(),
      change: `${projectStats.design} in design`,
      icon: Clock,
      color: "text-orange-600"
    },
    {
      title: "Manufacturing",
      value: projectStats.manufacturing.toString(),
      change: `${projectStats.shipping} ready to ship`,
      icon: Factory,
      color: "text-yellow-600"
    },
    {
      title: "Completed",
      value: projectStats.completed.toString(),
      change: `${completionRate}% completion rate`,
      icon: CheckCircle,
      color: "text-green-600"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "project initiation": return "bg-blue-100 text-blue-800";
      case "design stage": return "bg-blue-100 text-blue-800";
      case "manufacturing": return "bg-orange-100 text-orange-800";
      case "shipping": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "project initiation": return "Project Initiation";
      case "design stage": return "Design Stage";
      case "manufacturing": return "Manufacturing";
      case "shipping": return "Shipping";
      case "completed": return "Completed";
      default: return status;
    }
  };

  const getProgressFromStatus = (status: string) => {
    switch (status) {
      case "project initiation": return 10;
      case "design stage": return 30;
      case "manufacturing": return 70;
      case "shipping": return 90;
      case "completed": return 100;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track progress on your packaging design, manufacturing, and shipping
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Progress */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Project Progress
              </CardTitle>
              <CardDescription>
                Current status of your packaging projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {myTaskProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active projects in your tasks</p>
                </div>
              ) : (
                myTaskProjects.map((project) => (
                  <div key={project.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.client}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusDisplayName(project.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{getStatusDisplayName(project.status)}</span>
                        <span className="font-medium">{getProgressFromStatus(project.status)}%</span>
                      </div>
                      <Progress value={getProgressFromStatus(project.status)} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.due_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {project.type}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Updates */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                New Project
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Factory className="h-4 w-4 mr-2" />
                Manufacturing Update
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Truck className="h-4 w-4 mr-2" />
                Track Shipment
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-green-100 rounded">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Tea Collection Shipped</p>
                  <p className="text-xs text-muted-foreground">Tracking: TC2024001</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-1 bg-orange-100 rounded">
                  <Factory className="h-4 w-4 text-orange-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Coffee Packaging in QA</p>
                  <p className="text-xs text-muted-foreground">Quality testing phase</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Energy Drink Review</p>
                  <p className="text-xs text-muted-foreground">Awaiting client feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;