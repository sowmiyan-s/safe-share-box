import { Button } from "@/components/ui/button";
import { Cloud, Upload, Shield, Share } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-cloud.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-hero-gradient min-h-screen flex items-center">
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Cloud Based
              <span className="block bg-cloud-gradient bg-clip-text text-transparent">
                File Storage
              </span>
              <span className="block text-accent">& Sharing</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Securely store, organize, and share your files from anywhere. 
              Upload any format, generate shareable links, and protect with passwords.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth">
                <Button size="lg" variant="hero" className="text-lg px-8 py-4 w-full sm:w-auto">
                  Login / Register
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 w-full sm:w-auto">
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-glow">
              <img 
                src={heroImage} 
                alt="Cloud storage illustration" 
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-cloud-gradient opacity-20"></div>
            </div>
            
            {/* Floating Feature Cards */}
            <div className="absolute -top-4 -left-4 bg-glass backdrop-blur-sm rounded-xl p-4 shadow-soft border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cloud-gradient rounded-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">Any Format</span>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -right-4 bg-glass backdrop-blur-sm rounded-xl p-4 shadow-soft border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cloud-gradient rounded-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">Password Protected</span>
              </div>
            </div>
            
            <div className="absolute top-1/2 -right-8 bg-glass backdrop-blur-sm rounded-xl p-4 shadow-soft border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cloud-gradient rounded-lg">
                  <Share className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">Easy Sharing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;