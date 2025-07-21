import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit,
  Save,
  X,
  Upload,
  FileImage,
  Trash2,
  Loader2,
  Circle
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // Fetch profile data
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPortfolio();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      } else {
        // Create a new profile if none exists
        const newProfile = {
          user_id: user?.id,
          name: user?.user_metadata?.name || null,
          email: user?.email || null,
          phone: user?.user_metadata?.phone || null,
          location: null,
          status: 'active',
        };

        const { data: newData, error: insertError } = await supabase
          .from('designer_profiles')
          .insert([newProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          toast({
            title: "Error",
            description: "Failed to create profile",
            variant: "destructive",
          });
        } else {
          setProfile(newData);
          setEditedProfile(newData);
        }
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching portfolio:', error);
        return;
      }

      setPortfolio(data || []);
    } catch (error) {
      console.error('Error in fetchPortfolio:', error);
    }
  };

  const handleEdit = () => {
    setEditedProfile(profile || {});
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('designer_profiles')
        .update(editedProfile)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to save profile",
          variant: "destructive",
        });
        return;
      }

      setProfile({ ...profile, ...editedProfile });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName);

      // Create portfolio item
      const newPortfolioItem = {
        user_id: user.id,
        title: "New Portfolio Item",
        description: "Click edit to add description",
        image_url: publicUrl,
        category: "Design"
      };

      const { data, error } = await supabase
        .from('portfolio_items')
        .insert([newPortfolioItem])
        .select()
        .single();

      if (error) {
        console.error('Error creating portfolio item:', error);
        toast({
          title: "Error",
          description: "Failed to create portfolio item",
          variant: "destructive",
        });
        return;
      }

      setPortfolio(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Portfolio item added successfully",
      });
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePortfolioItem = async (id: string, imageUrl: string | null) => {
    try {
      const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting portfolio item:', error);
        toast({
          title: "Error",
          description: "Failed to delete portfolio item",
          variant: "destructive",
        });
        return;
      }

      // Delete from storage if image exists
      if (imageUrl) {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${user?.id}/${fileName}`;
        
        await supabase.storage
          .from('portfolio')
          .remove([filePath]);
      }

      setPortfolio(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Portfolio item deleted successfully",
      });
    } catch (error) {
      console.error('Error in handleDeletePortfolioItem:', error);
      toast({
        title: "Error",
        description: "Failed to delete portfolio item",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} disabled={isLoading}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={undefined} alt={profile.email || 'User'} />
              <AvatarFallback className="text-lg">
                {profile.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {!isEditing ? (
                <>
                  <div>
                    <h3 className="text-xl font-semibold">{profile.name || profile.email || 'User'}</h3>
                    <p className="text-muted-foreground">{profile.location || 'Location not set'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Circle className={`h-3 w-3 ${profile.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`} />
                      <span className="text-sm text-muted-foreground capitalize">
                        {profile.status || 'active'}
                      </span>
                    </div>
                    <Select
                      value={profile.status || 'active'}
                      onValueChange={async (value) => {
                        try {
                          const { error } = await supabase
                            .from('designer_profiles')
                            .update({ status: value })
                            .eq('user_id', user?.id);

                          if (error) {
                            console.error('Error updating status:', error);
                            toast({
                              title: "Error",
                              description: "Failed to update status",
                              variant: "destructive",
                            });
                            return;
                          }

                          setProfile(prev => prev ? { ...prev, status: value } : null);
                          toast({
                            title: "Success",
                            description: "Status updated successfully",
                          });
                        } catch (error) {
                          console.error('Error updating status:', error);
                          toast({
                            title: "Error",
                            description: "Failed to update status",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 text-green-500" />
                            Active
                          </div>
                        </SelectItem>
                        <SelectItem value="busy">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 text-yellow-500" />
                            Busy
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Phone: {profile.phone || 'Not provided'}
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedProfile.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editedProfile.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editedProfile.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Enter location"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editedProfile.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editedProfile.status || 'active'}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {!isEditing ? (
                <span className="text-sm">{profile.email || 'No email'}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {profile.email || 'No email'} (from auth)
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {!isEditing ? (
                <span className="text-sm">{profile.phone || 'No phone number'}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Phone updated above
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {!isEditing ? (
                <span className="text-sm">{profile.location || 'No location'}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Location updated above
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="portfolio-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" disabled={uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload Work'}
              </Button>
            </Label>
            <Input
              id="portfolio-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              Upload your design work to showcase your portfolio
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <Card key={item.id} className="group relative overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={item.image_url || '/api/placeholder/300/200'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeletePortfolioItem(item.id, item.image_url)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{item.description || 'No description'}</p>
                  <Badge variant="outline" className="text-xs">
                    {item.category || 'Design'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {portfolio.length === 0 && (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                No portfolio items yet
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload your first design to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;