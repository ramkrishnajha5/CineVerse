
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      email: '',
      message: '',
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const formDataToSend = new FormData();
    formDataToSend.append('access_key', '9c3c5d8f-2f9c-40a7-ba3c-af0e8bfce179');
    formDataToSend.append('name', `${formData.firstName} ${formData.lastName}`);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('message', formData.message);
    formDataToSend.append('from_name', 'CineVerse Contact Form');
    formDataToSend.append('subject', 'New Contact Form Submission from CineVerse');

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmitStatus('success');
        setStatusMessage('Thank you for your message! We\'ll get back to you within 24 hours.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          message: '',
        });
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      setSubmitStatus('error');
      setStatusMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-center mb-4 bg-gradient-to-r from-pink-500 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Have questions, suggestions, or feedback? We'd love to hear from you!
          </p>
          
          <div className="bg-card border border-border rounded-xl p-8 shadow-2xl backdrop-blur-sm transition-all duration-300 hover:shadow-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name and Last Name Row */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className={`transition-all duration-200 focus:ring-2 focus:ring-pink-400 ${
                      errors.firstName ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className={`transition-all duration-200 focus:ring-2 focus:ring-pink-400 ${
                      errors.lastName ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className={`transition-all duration-200 focus:ring-2 focus:ring-cyan-400 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>
              
              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Tell us what's on your mind..."
                  rows={6}
                  className={`transition-all duration-200 focus:ring-2 focus:ring-green-400 resize-none ${
                    errors.message ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.message}
                  </p>
                )}
              </div>
              
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 via-cyan-400 to-green-400 hover:from-pink-600 hover:via-cyan-500 hover:to-green-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
            
            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg transition-all duration-300 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">Message Sent Successfully!</p>
                </div>
                <p className="text-green-600 dark:text-green-300 text-sm mt-1">
                  {statusMessage}
                </p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg transition-all duration-300 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">Failed to Send Message</p>
                </div>
                <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                  {statusMessage}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
