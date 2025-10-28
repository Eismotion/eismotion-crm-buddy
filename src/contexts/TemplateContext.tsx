import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Template {
  id: string;
  name: string | null;
  category: string | null;
  background_base64: string | null;
  thumbnail_base64?: string | null;
  has_header_text?: boolean | null;
  created_at: string;
  updated_at?: string | null;
}

interface TemplateContextType {
  templates: Template[];
  selectedTemplate: Template | null;
  isLoading: boolean;
  error: string | null;
  refreshTemplates: () => Promise<void>;
  selectTemplate: (id: string) => void;
  selectTemplateByName: (name: string) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

interface TemplateProviderProps {
  children: ReactNode;
}

export function TemplateProvider({ children }: TemplateProviderProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('invoice_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      console.log(`✅ Loaded ${data?.length || 0} templates from database`);
      setTemplates(data || []);
      
      // Auto-select first template if none selected
      if (data && data.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
        console.log(`✅ Auto-selected template: ${data[0].name}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Error loading templates:', err);
      toast.error(`Fehler beim Laden der Templates: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setSelectedTemplate(template);
      console.log(`✅ Selected template by ID: ${template.name}`);
    } else {
      console.warn(`⚠️ Template with ID ${id} not found`);
    }
  };

  const selectTemplateByName = (name: string) => {
    const template = templates.find(t => t.name === name);
    if (template) {
      setSelectedTemplate(template);
      console.log(`✅ Selected template by name: ${template.name}`);
    } else {
      console.warn(`⚠️ Template with name "${name}" not found`);
    }
  };

  // Initial load
  useEffect(() => {
    refreshTemplates();
  }, []);

  // Subscribe to template changes in realtime
  useEffect(() => {
    const channel = supabase
      .channel('template-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoice_templates'
        },
        (payload) => {
          console.log('🔄 Template change detected:', payload);
          refreshTemplates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value: TemplateContextType = {
    templates,
    selectedTemplate,
    isLoading,
    error,
    refreshTemplates,
    selectTemplate,
    selectTemplateByName
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
}
