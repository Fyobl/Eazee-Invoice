import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Banner } from '@/components/ui/banner';
import { getUserByEmail, makeUserAdmin } from '@/lib/auth';

export const AdminSetup = () => {
  const [email, setEmail] = useState('fyobl_ben@hotmail.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMakeAdmin = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const user = await getUserByEmail(email);
      if (!user) {
        setError('User not found');
        return;
      }

      await makeUserAdmin(user.uid);
      setMessage('User successfully made admin with full access!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to make user admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Admin Setup</h2>
      
      {message && (
        <Banner variant="success" onClose={() => setMessage(null)}>
          {message}
        </Banner>
      )}
      
      {error && (
        <Banner variant="error" onClose={() => setError(null)}>
          {error}
        </Banner>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
            className="mt-1"
          />
        </div>
        
        <Button 
          onClick={handleMakeAdmin}
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? 'Processing...' : 'Make Admin'}
        </Button>
      </div>
    </div>
  );
};