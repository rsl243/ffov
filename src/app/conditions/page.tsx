"use client";

import Link from 'next/link';

export default function ConditionsPage() {
  return (
    <main className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <div className="text-black font-bold text-3xl">
              <span className="text-gradient">Faet</span>
              <div className="text-xs font-light mt-1">GAGNEZ EN PHYGITAL</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Conditions d'utilisation pour les vendeurs</h1>
        </div>

        {/* Conditions content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">1. Objet</h2>
            <p className="text-gray-700">
              Ces conditions définissent les règles et obligations des vendeurs qui synchronisent leur site avec FAET et acceptent que leurs produits soient affichés et utilisés pour la vente sans intervention directe sur leurs sites.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">2. Synchronisation et récupération des données</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>En synchronisant leur site avec FAET les vendeurs autorisent la récupération automatique des informations de leurs produits (images, prix, descriptions, etc.).</li>
              <li>FAET n'effectue aucune modification ou intervention sur le site du vendeur. Seules les données affichées sur FAET sont utilisées pour la vente.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">3. Responsabilité du vendeur</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Les vendeurs garantissent que les produits et les informations récupérées sont conformes aux réglementations en vigueur.</li>
              <li>Toute modification des produits ou des prix sur le site du vendeur est sous sa responsabilité exclusive.</li>
              <li>Le vendeur s'engage à fournir des informations précises et à jour sur ses produits afin d'assurer une expérience utilisateur optimale sur FAET.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">4. Responsabilité de FAET</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>FAET agit uniquement comme un intermédiaire et ne peut être tenu responsable des erreurs ou omissions dans les données des vendeurs.</li>
              <li>En cas de litige sur les produits affichés, la responsabilité revient au vendeur, qui devra résoudre le problème.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">5. Propriété intellectuelle</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Les vendeurs conservent tous les droits de propriété intellectuelle sur leurs contenus.</li>
              <li>En synchronisant leurs produits avec FAET, ils accordent une licence d'utilisation non exclusive permettant à la plateforme d'afficher les informations à des fins commerciales.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">6. Modification des conditions</h2>
            <p className="text-gray-700">
              FAET se réserve le droit de modifier les présentes conditions. Les vendeurs seront informés des changements et devront accepter les nouvelles conditions pour continuer à utiliser la plateforme.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold mb-3">7. Résiliation</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Les vendeurs peuvent à tout moment demander la suppression de leur compte.</li>
              <li>En cas de non-respect des présentes conditions, FAET se réserve le droit de suspendre ou de résilier l'accès à ses services.</li>
            </ul>
          </section>
        </div>

        {/* Back button */}
        <div className="text-center">
          <Link href="/onboarding" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Retour à l'inscription
          </Link>
        </div>
      </div>
    </main>
  );
}
