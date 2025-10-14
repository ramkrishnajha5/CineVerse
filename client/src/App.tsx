import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import MovieDetail from "@/pages/MovieDetail";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import RequireAuth from "@/components/RequireAuth";
import { AuthProvider } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Movies from "./pages/Movies";
import Series from "./pages/Series";
import PersonDetail from "./pages/PersonDetail";
import { ScrollToTop } from "@/components/ScrollToTop";

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Home} />
        <Route path="/movie/:id" component={MovieDetail} />
        <Route path="/tv/:id" component={MovieDetail} />
        <Route path="/person/:id" component={PersonDetail} />
        <Route path="/movies" component={Movies} />
        <Route path="/series" component={Series} />
        <Route path="/dashboard">
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        </Route>
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
