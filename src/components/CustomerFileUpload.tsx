import { Upload, File, Image, FileText, X, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CustomerFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string;
  created_at: string;
}

interface CustomerFileUploadProps {
  customerId: string;
}

export const CustomerFileUpload = ({ customerId }: CustomerFileUploadProps) => {
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('invoice');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadFiles();
  }, [customerId]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_files')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Bitte wählen Sie eine Datei aus');
      return;
    }

    setUploading(true);
    try {
      // Upload to storage
      const filePath = `${customerId}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('customer-files')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('customer_files')
        .insert({
          customer_id: customerId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          category: category,
          description: description,
        });

      if (dbError) throw dbError;

      toast.success('Datei erfolgreich hochgeladen');
      setSelectedFile(null);
      setDescription('');
      await loadFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Fehler beim Hochladen der Datei');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: CustomerFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('customer-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Fehler beim Herunterladen der Datei');
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm('Möchten Sie diese Datei wirklich löschen?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('customer-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('customer_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast.success('Datei erfolgreich gelöscht');
      await loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Fehler beim Löschen der Datei');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'invoice': return <FileText className="h-4 w-4" />;
      case 'logo': return <Image className="h-4 w-4" />;
      case 'document': return <File className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'invoice': return 'bg-blue-500';
      case 'logo': return 'bg-purple-500';
      case 'document': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dateien & Dokumente ({files.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Datei hochladen</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <File className="h-4 w-4" />
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Rechnung / Druckdatei</SelectItem>
                  <SelectItem value="logo">Logo / Bild</SelectItem>
                  <SelectItem value="document">Dokument</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Input
                id="description"
                placeholder="z.B. Rechnung 2024 oder Firmenlogo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </Button>
        </div>

        {/* Files List */}
        {files.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            Noch keine Dateien hochgeladen
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dateiname</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Größe</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.file_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(file.category)}
                          <Badge className={getCategoryColor(file.category)}>
                            {file.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {file.description || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatFileSize(file.file_size)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(file.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file.id, file.file_path)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(file.category)}
                          <div>
                            <p className="font-medium text-sm">{file.file_name}</p>
                            <Badge className={`${getCategoryColor(file.category)} mt-1`}>
                              {file.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {file.description && (
                        <p className="text-sm text-muted-foreground">{file.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.created_at).toLocaleDateString('de-DE')}</span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(file.id, file.file_path)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
