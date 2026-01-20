import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ProcessedReportData } from '@/types/report';
import { AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface FlaggedPostsProps {
  data: ProcessedReportData[];
  filters?: {
    sentiment?: string;
    nature?: string;
    word?: string;
  };
}

export function FlaggedPosts({ data, filters }: FlaggedPostsProps) {
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [natureFilters, setNatureFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  
  const postsPerPage = 10;

  // Get unique nature types
  const uniqueNatures = useMemo(() => {
    const natures = new Set(data.map(item => item.nature));
    return Array.from(natures).sort();
  }, [data]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return data.filter(item => {
      // Always show dangerous posts or apply external filters
      const matchesDangerous = item.dangerous || filters?.sentiment || filters?.nature || filters?.word;
      if (!matchesDangerous) return false;

      // Apply sentiment filter
      if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) {
        return false;
      }

      // Apply nature filters
      if (natureFilters.length > 0 && !natureFilters.includes(item.nature)) {
        return false;
      }

      // Apply external filters
      if (filters?.sentiment && item.sentiment !== filters.sentiment) {
        return false;
      }
      
      if (filters?.nature && item.nature !== filters.nature) {
        return false;
      }

      if (filters?.word && !item.clean_text.toLowerCase().includes(filters.word.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [data, sentimentFilter, natureFilters, filters]);

  // Paginated posts
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * postsPerPage;
    return filteredPosts.slice(startIndex, startIndex + postsPerPage);
  }, [filteredPosts, currentPage]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const toggleNatureFilter = (nature: string) => {
    setNatureFilters(prev => 
      prev.includes(nature) 
        ? prev.filter(n => n !== nature)
        : [...prev, nature]
    );
    setCurrentPage(1);
  };

  const togglePostExpansion = (index: number) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toUpperCase()) {
      case 'POSITIVE': return 'bg-chart-success text-white';
      case 'NEGATIVE': return 'bg-chart-danger text-white';
      default: return 'bg-chart-primary text-white';
    }
  };

  return (
    <Card className="bg-dashboard-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-chart-danger" />
          Flagged Posts ({filteredPosts.length})
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Sentiment Filter
            </label>
            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="POSITIVE">Positive</SelectItem>
                <SelectItem value="NEGATIVE">Negative</SelectItem>
                <SelectItem value="NEUTRAL">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-2">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Nature Filters
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
              {uniqueNatures.map(nature => (
                <div key={nature} className="flex items-center space-x-2">
                  <Checkbox
                    id={`nature-${nature}`}
                    checked={natureFilters.includes(nature)}
                    onCheckedChange={() => toggleNatureFilter(nature)}
                  />
                  <label
                    htmlFor={`nature-${nature}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {nature}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {paginatedPosts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No posts match the current filters.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedPosts.map((post, index) => {
                const isExpanded = expandedPosts.has(index);
                const displayText = isExpanded 
                  ? post.clean_text 
                  : post.clean_text.slice(0, 300) + (post.clean_text.length > 300 ? '...' : '');

                return (
                  <div 
                    key={index} 
                    className="border border-border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={getSentimentColor(post.sentiment)}>
                            {post.sentiment}
                          </Badge>
                          <Badge variant="outline">
                            {post.nature}
                          </Badge>
                          {post.dangerous && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Dangerous
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-foreground leading-relaxed">
                          {displayText}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {post.subreddit && (
                            <span>r/{post.subreddit}</span>
                          )}
                          {post.username && (
                            <span>u/{post.username}</span>
                          )}
                          {post.created_at && (
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          )}
                          {post.score !== undefined && (
                            <span>Score: {post.score}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {post.url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(post.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {post.clean_text.length > 300 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePostExpansion(index)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                More
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}