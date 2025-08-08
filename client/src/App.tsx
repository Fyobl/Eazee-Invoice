import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/Layout/ProtectedRoute";

// Public pages
import { Landing } from "@/pages/Landing";
import { TrialExpired } from "@/pages/TrialExpired";
import { Suspended } from "@/pages/Suspended";
import NotFound from "@/pages/not-found";
import { Register } from "@/pages/Auth/Register";
import { LoginPage } from "@/pages/Auth/LoginPage";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import { AboutUs } from "@/pages/AboutUs";
import { PrivacyPolicy } from "@/pages/PrivacyPolicy";
import { TermsOfService } from "@/pages/TermsOfService";

import { Support } from "@/pages/Support";

// Protected pages
import { Dashboard } from "@/pages/Dashboard";
import { InvoiceList } from "@/pages/Invoices/InvoiceList";
import { InvoiceForm } from "@/pages/Invoices/InvoiceForm";
import { QuoteList } from "@/pages/Quotes/QuoteList";
import { QuoteForm } from "@/pages/Quotes/QuoteForm";
import { StatementList } from "@/pages/Statements/StatementList";
import { StatementForm } from "@/pages/Statements/StatementForm";
import { CustomerList } from "@/pages/Customers/CustomerList";
import { CustomerForm } from "@/pages/Customers/CustomerForm";
import { ProductList } from "@/pages/Products/ProductList";
import { ProductForm } from "@/pages/Products/ProductForm";
import { Settings } from "@/pages/Settings";
import { Account } from "@/pages/Account";
import { EmailSettings } from "@/pages/EmailSettings";
import { Reports } from "@/pages/Reports";
import { RecycleBin } from "@/pages/RecycleBin";
import { AdminPanel } from "@/pages/Admin/AdminPanel";
import SubscribeNew from "@/pages/SubscribeNew";
import ManageSubscription from "@/pages/ManageSubscription";
import { Help } from "@/pages/Help";
import { StripeProvider } from "@/components/StripeProvider";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/trial-expired" component={TrialExpired} />
      <Route path="/suspended" component={Suspended} />
      <Route path="/subscribe" component={SubscribeNew} />
      <Route path="/about" component={AboutUs} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />

      <Route path="/support" component={Support} />
      
      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/invoices">
        <ProtectedRoute>
          <InvoiceList />
        </ProtectedRoute>
      </Route>
      
      <Route path="/invoices/new">
        <ProtectedRoute>
          <InvoiceForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/quotes">
        <ProtectedRoute>
          <QuoteList />
        </ProtectedRoute>
      </Route>
      
      <Route path="/quotes/new">
        <ProtectedRoute>
          <QuoteForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/statements">
        <ProtectedRoute>
          <StatementList />
        </ProtectedRoute>
      </Route>
      
      <Route path="/statements/new">
        <ProtectedRoute>
          <StatementForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers">
        <ProtectedRoute>
          <CustomerList />
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers/new">
        <ProtectedRoute>
          <CustomerForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/customers/:id/edit">
        <ProtectedRoute>
          <CustomerForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/products">
        <ProtectedRoute>
          <ProductList />
        </ProtectedRoute>
      </Route>
      
      <Route path="/products/new">
        <ProtectedRoute>
          <ProductForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/products/:id/edit">
        <ProtectedRoute>
          <ProductForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/invoices/:id/edit">
        <ProtectedRoute>
          <InvoiceForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/quotes/:id/edit">
        <ProtectedRoute>
          <QuoteForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/statements/:id/edit">
        <ProtectedRoute>
          <StatementForm />
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/account">
        <ProtectedRoute>
          <Account />
        </ProtectedRoute>
      </Route>
      
      <Route path="/email-settings">
        <ProtectedRoute>
          <EmailSettings />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      
      <Route path="/recycle-bin">
        <ProtectedRoute>
          <RecycleBin />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPanel />
        </ProtectedRoute>
      </Route>
      
      <Route path="/help">
        <ProtectedRoute>
          <Help />
        </ProtectedRoute>
      </Route>
      
      <Route path="/manage-subscription">
        <ProtectedRoute>
          <ManageSubscription />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <StripeProvider>
              <Toaster />
              <Router />
            </StripeProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
