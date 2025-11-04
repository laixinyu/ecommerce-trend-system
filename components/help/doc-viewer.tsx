'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Home,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocSection {
  id: string;
  title: string;
  content: React.ReactNode;
  subsections?: DocSection[];
}

interface DocViewerProps {
  title: string;
  sections: DocSection[];
  currentSection?: string;
  onSectionChange?: (sectionId: string) => void;
  className?: string;
}

export function DocViewer({
  title,
  sections,
  currentSection,
  onSectionChange,
  className,
}: DocViewerProps) {
  const flatSections = flattenSections(sections);
  const currentIndex = currentSection
    ? flatSections.findIndex((s) => s.id === currentSection)
    : 0;
  const current = flatSections[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < flatSections.length - 1;

  const handlePrev = () => {
    if (hasPrev && onSectionChange) {
      onSectionChange(flatSections[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext && onSectionChange) {
      onSectionChange(flatSections[currentIndex + 1].id);
    }
  };

  return (
    <div className={cn('grid gap-6 lg:grid-cols-[250px_1fr]', className)}>
      {/* Table of Contents */}
      <Card className="h-fit sticky top-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            目录
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {sections.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => onSectionChange?.(section.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  current?.id === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                {section.title}
              </button>
              {section.subsections && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.subsections.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => onSectionChange?.(sub.id)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors',
                        current?.id === sub.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {sub.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{current?.title || title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {currentIndex + 1} / {flatSections.length}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            {current?.content}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={!hasPrev}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            上一节
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onSectionChange?.(sections[0].id)}>
            <Home className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={!hasNext}
            className="gap-2"
          >
            下一节
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function flattenSections(sections: DocSection[]): DocSection[] {
  const result: DocSection[] = [];
  for (const section of sections) {
    result.push(section);
    if (section.subsections) {
      result.push(...flattenSections(section.subsections));
    }
  }
  return result;
}
