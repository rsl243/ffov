import { supabase } from './supabase';
import { UserProfile } from '@/contexts/UserProfileContext';

// Type du plan d'abonnement
export type SubscriptionPlan = 'ville' | 'region' | 'pays';

/**
 * Récupère le profil complet de l'utilisateur
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    console.log('Récupération du profil utilisateur');
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    // Récupérer les données supplémentaires du profil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.warn('Erreur lors de la récupération du profil:', profileError);
    }
    
    // Extraire les métadonnées
    const metadata = user.user_metadata || {};
    const firstName = metadata.first_name || '';
    const lastName = metadata.last_name || '';
    
    // Construire le profil utilisateur
    const profile: UserProfile = {
      id: user.id,
      email: user.email || '',
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`.trim() || 'Utilisateur',
      phone: metadata.phone || profileData?.phone || '',
      avatar: metadata.avatar_url || profileData?.avatar_url || '',
      company: metadata.company || profileData?.company || '',
      selectedPlan: metadata.selected_plan || profileData?.selected_plan || 'ville',
      productTypes: metadata.product_types || profileData?.product_types || [],
      address: metadata.address || profileData?.address || '',
      createdAt: user.created_at || new Date().toISOString(),
      updatedAt: user.updated_at || new Date().toISOString()
    };
    
    return profile;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil utilisateur:', error);
    return null;
  }
};

/**
 * Met à jour le profil de l'utilisateur
 */
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    console.log('Début de mise à jour du profil avec:', updates);
    
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Tentative de mise à jour avec utilisateur non connecté');
      throw new Error('Utilisateur non connecté');
    }
    
    // Séparer les mises à jour entre Auth et la table profiles
    const authUpdates: any = {};
    const profileUpdates: any = {
      updated_at: new Date().toISOString()
    };
    
    // Mapper les champs pour Auth
    if (updates.firstName !== undefined) authUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) authUpdates.last_name = updates.lastName;
    if (updates.selectedPlan !== undefined) authUpdates.selected_plan = updates.selectedPlan;
    if (updates.productTypes !== undefined) authUpdates.product_types = updates.productTypes;
    
    // Mapper les champs pour profiles
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
    if (updates.company !== undefined) profileUpdates.company = updates.company;
    if (updates.address !== undefined) profileUpdates.address = updates.address;
    
    // Mettre à jour les métadonnées Auth si nécessaire
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({
        data: authUpdates
      });
      
      if (authError) {
        throw authError;
      }
    }
    
    // Vérifier si un profil existe déjà
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id);
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.warn('Erreur lors de la vérification du profil:', checkError);
    }
    
    // Mettre à jour ou créer le profil
    if (existingProfile && existingProfile.length > 0) {
      console.log('Mise à jour du profil existant avec:', profileUpdates);
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Erreur lors de la mise à jour du profil:', updateError);
        throw updateError;
      }
    } else {
      console.log('Création d\'un nouveau profil avec:', profileUpdates);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          ...profileUpdates,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Erreur lors de la création du profil:', insertError);
        throw insertError;
      }
    }
    
    // Attendre un peu pour s'assurer que les données sont mises à jour
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Récupérer le profil mis à jour
    const updatedProfile = await getUserProfile();
    
    console.log('Profil mis à jour avec succès:', updatedProfile);
    
    // Mettre à jour également le localStorage pour compatibilité avec l'ancien système
    if (typeof window !== 'undefined' && updatedProfile) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('faet_user') || '{}');
        localStorage.setItem('faet_user', JSON.stringify({
          ...storedUser,
          id: updatedProfile.id,
          fullName: updatedProfile.fullName,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          email: updatedProfile.email
        }));
        console.log('LocalStorage mis à jour avec le profil utilisateur');
      } catch (localStorageError) {
        console.error('Erreur lors de la mise à jour du localStorage:', localStorageError);
        // Non bloquant, on continue
      }
    }
    
    return updatedProfile;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
    throw error;
  }
};

/**
 * Valide si l'utilisateur est connecté
 */
export const isUserLoggedIn = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    console.error('Erreur lors de la vérification de connexion:', error);
    return false;
  }
};

/**
 * Met à jour le plan d'abonnement de l'utilisateur
 */
export const updateUserPlan = async (plan: SubscriptionPlan): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: { selected_plan: plan }
    });
    
    if (error) {
      throw error;
    }
    
    // Mise à jour du localStorage pour compatibilité avec l'ancien système
    if (typeof window !== 'undefined') {
      const storedUser = JSON.parse(localStorage.getItem('faet_user') || '{}');
      localStorage.setItem('faet_user', JSON.stringify({
        ...storedUser,
        selectedPlan: plan
      }));
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du plan:', error);
    return false;
  }
};

/**
 * Récupère le plan d'abonnement actuel de l'utilisateur
 */
export const getUserPlan = async (): Promise<SubscriptionPlan> => {
  try {
    const profile = await getUserProfile();
    return profile?.selectedPlan || 'ville';
  } catch (error) {
    console.error('Erreur lors de la récupération du plan:', error);
    return 'ville'; // Plan par défaut
  }
};
