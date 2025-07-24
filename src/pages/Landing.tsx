import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Terminal, FileText, Search, Users, Zap, Shield, Sparkles, Code, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const TypingAnimation = ({ text, speed = 150 }: { text: string; speed?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Start typing after a small delay
    const startDelay = setTimeout(() => {
      setHasStarted(true);
    }, 500);
    
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const timeout = setTimeout(() => {
      if (isDeleting) {
        // Backspacing
        if (currentIndex > 0) {
          setDisplayText(text.slice(0, currentIndex - 1));
          setCurrentIndex(currentIndex - 1);
        } else {
          // Finished deleting, start typing again
          setIsDeleting(false);
        }
      } else {
        // Typing
        if (currentIndex < text.length) {
          setDisplayText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => {
            setIsDeleting(true);
          }, 2000); // Pause for 2 seconds when complete
        }
      }
    }, isDeleting ? speed / 2 : speed); // Faster when deleting

    return () => clearTimeout(timeout);
  }, [currentIndex, text, speed, hasStarted, isDeleting]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <span className="relative inline-block text-5xl font-bold">
      <span className="text-primary">
        {displayText}
      </span>
      <span className={`inline-block w-0.5 h-12 bg-primary ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`} />
    </span>
  );
};

const Landing = () => {
  // SEO Meta tags
  useEffect(() => {
    document.title = 'DevNotes - AI-Powered Command Library for Developers | Code Snippets & Terminal Commands';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'DevNotes is the intelligent command library for developers. Store, organize, and discover your most used terminal commands and code snippets with AI-powered suggestions. Free developer tools.');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'DevNotes is the intelligent command library for developers. Store, organize, and discover your most used terminal commands and code snippets with AI-powered suggestions. Free developer tools.';
      document.head.appendChild(meta);
    }

    // Add keywords meta tag
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'developer tools, command library, code snippets, terminal commands, AI suggestions, syntax highlighting, developer productivity, command line, bash, shell, coding tools');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'developer tools, command library, code snippets, terminal commands, AI suggestions, syntax highlighting, developer productivity, command line, bash, shell, coding tools';
      document.head.appendChild(meta);
    }

    // Add Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      meta.content = 'DevNotes - AI-Powered Command Library for Developers';
      document.head.appendChild(meta);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      meta.content = 'The intelligent command library for developers. Store, organize, and discover your most used commands and code snippets with AI-powered suggestions.';
      document.head.appendChild(meta);
    }

    const ogType = document.querySelector('meta[property="og:type"]');
    if (!ogType) {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:type');
      meta.content = 'website';
      document.head.appendChild(meta);
    }

    // Add structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "DevNotes",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Web",
      "description": "AI-powered command library and code snippet manager for developers",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": [
        "AI-powered command suggestions",
        "Syntax highlighting",
        "Command validation",
        "Instant search",
        "Team collaboration",
        "Secure storage"
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      // Cleanup structured data script
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Terminal className="h-12 w-12 text-primary" />
              <h1>
                <TypingAnimation text="DevNotes" speed={200} />
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              The intelligent command library for developers. Store, organize, and discover your most used terminal commands and code snippets with AI-powered suggestions.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="gap-2">
                <Link to="/signup">
                  <Sparkles className="h-5 w-5" />
                  Get Started Free
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/auth">
                  <Terminal className="h-5 w-5" />
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Modern Developers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your terminal commands, bash scripts, and code snippets efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Powered Command Suggestions</CardTitle>
                <CardDescription>
                  Get intelligent auto-categorization and improvement suggestions for your bash commands, shell scripts, and code snippets
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Code className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Advanced Syntax Highlighting</CardTitle>
                <CardDescription>
                  Beautiful syntax highlighting for shell, bash, Python, JavaScript, SQL, and 50+ programming languages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Command Validation</CardTitle>
                <CardDescription>
                  Intelligent validation and suggestions to help you write better terminal commands and avoid common mistakes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lightning-Fast Search</CardTitle>
                <CardDescription>
                  Find your commands, code snippets, and notes instantly with powerful full-text search functionality
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share command libraries and code snippets with your development team for better collaboration and knowledge sharing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Enterprise-Grade Security</CardTitle>
                <CardDescription>
                  Your commands and code snippets are encrypted and secure with role-based access control and data privacy
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-card/50" id="benefits">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Stop Googling the Same Terminal Commands</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Terminal className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Save Development Time</h3>
                    <p className="text-muted-foreground">Never forget complex bash commands, Docker commands, or git aliases again. Build your personal developer knowledge base and boost productivity.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Stay Organized</h3>
                    <p className="text-muted-foreground">Organize terminal commands, shell scripts, and code snippets with smart tagging, categorization, and AI-powered organization.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Code Faster</h3>
                    <p className="text-muted-foreground">Quick copy-paste functionality, intelligent command suggestions, and syntax highlighting boost your coding productivity.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Docker System Cleanup</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    docker system prune -af --volumes
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Remove all unused containers, networks, images, and volumes to free up disk space
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">docker</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">cleanup</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">devops</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" id="get-started">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Boost Your Developer Productivity?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who have streamlined their workflow with DevNotes. Start organizing your terminal commands and code snippets today.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/signup">
              <Sparkles className="h-5 w-5" />
              Start Your Free Developer Account
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-primary" />
              <span className="font-semibold">DevNotes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 DevNotes. Built for developers, by developers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;