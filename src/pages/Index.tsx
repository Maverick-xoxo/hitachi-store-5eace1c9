import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import heroImage from '@/assets/hero-merchandise.jpg';
const Index = () => {
  return <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Company merchandise" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="container relative py-24 md:py-32">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">Hitachi Digital Payment Solutions' Store</h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Show your company pride with our exclusive collection of branded merchandise. 
              From stylish apparel to everyday essentials, find the perfect items to represent your team.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link to="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Quality Products</h3>
            <p className="text-muted-foreground">
              Premium branded merchandise including t-shirts, mugs, pens, and more.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Easy Payments</h3>
            <p className="text-muted-foreground">
              Simple offline payment process. Upload your receipt and we handle the rest.
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card border">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Internal Delivery</h3>
            <p className="text-muted-foreground">
              Orders delivered right to your desk or department location.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50">
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Sign in with your company credentials to start shopping.
          </p>
          <Link to="/auth">
            <Button size="lg">
              Sign In to Shop
            </Button>
          </Link>
        </div>
      </section>
    </Layout>;
};
export default Index;