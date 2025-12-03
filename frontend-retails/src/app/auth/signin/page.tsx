'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const signInSchema = z.object({
  login: z.string().min(3, 'Le login doit contenir au moins 3 caractères'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      login: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        login: data.login,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error || 'Login ou mot de passe incorrect');
      } else {
        toast.success('Connexion réussie');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Selos Retails</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous avec votre compte Salesperson
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Login</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="votre.login"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

