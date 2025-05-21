"use client";

import React from 'react';
import { FiTool } from 'react-icons/fi';

export default function NotificationsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-sm p-12 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <FiTool className="text-6xl text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">En cours de développement</h1>
        <p className="text-gray-600 mb-6">
          La gestion des notifications est actuellement en cours de développement. 
          Cette fonctionnalité sera bientôt disponible.
        </p>
        <p className="text-sm text-gray-500">
          Nous travaillons activement pour vous offrir un système complet de préférences de notifications pour les commandes, les clients et les mises à jour importantes.
        </p>
      </div>
    </div>
  );
} 