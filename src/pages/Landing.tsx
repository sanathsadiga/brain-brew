import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Terminal, FileText, Search, Users, Zap, Shield, Sparkles, Code, CheckCircle } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Terminal className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                DevNotes
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              The intelligent command library for developers. Store, organize, and discover your most used commands and code snippets with AI-powered suggestions.
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Modern Developers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your commands and code snippets efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI-Powered Suggestions</CardTitle>
                <CardDescription>
                  Get intelligent auto-categorization and improvement suggestions for your commands
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Code className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Syntax Highlighting</CardTitle>
                <CardDescription>
                  Beautiful syntax highlighting for shell, Python, SQL, and more languages
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Command Validation</CardTitle>
                <CardDescription>
                  Smart validation and suggestions to help you write better commands
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Search className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Instant Search</CardTitle>
                <CardDescription>
                  Find your commands and notes instantly with powerful search functionality
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share command libraries with your team and collaborate effectively
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your commands are encrypted and secure with role-based access control
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Stop Googling the Same Commands</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Terminal className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Save Time</h3>
                    <p className="text-muted-foreground">Never forget complex commands again. Build your personal knowledge base.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Stay Organized</h3>
                    <p className="text-muted-foreground">Organize commands and notes with smart tagging and categorization.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Work Faster</h3>
                    <p className="text-muted-foreground">Quick copy-paste functionality and intelligent suggestions boost productivity.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-background/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Docker Cleanup</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    docker system prune -af --volumes
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Remove all unused containers, networks, images, and volumes
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">docker</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">cleanup</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Boost Your Productivity?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who have streamlined their workflow with DevNotes
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/signup">
              <Sparkles className="h-5 w-5" />
              Start Your Free Account
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