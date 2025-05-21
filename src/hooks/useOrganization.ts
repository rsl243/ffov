import { useEffect, useState } from 'react';
import { Organization } from '@/types/organization';
import { useSession } from 'next-auth/react';

export function useOrganization() {
  const { data: session } = useSession();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!session) {
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/organization');
        if (!response.ok) {
          throw new Error('Failed to fetch organization');
        }
        const data = await response.json();
        setOrganization(data);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [session]);

  return {
    organization,
    isLoading,
    error,
    setOrganization,
  };
}
