"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FiSend, FiSearch, FiMoreVertical, FiFile, FiImage, FiFilter, FiCalendar, FiMessageSquare, FiCheckCircle, FiAlertCircle, FiX } from 'react-icons/fi';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Message, Conversation, getMessages, sendMessage, markMessagesAsRead, updateMessageStatus, getMessagesStats } from '@/lib/messagesService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export default function Messages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'pending' | 'all'>('all');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    pending: 0
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Charger les messages depuis Supabase
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const response = await getMessages(currentPage, 10, statusFilter, searchTerm);
        setMessages(response.messages);
        setTotalPages(response.totalPages);
        
        // Charger les statistiques
        const statsData = await getMessagesStats();
        setStats(statsData);
      } catch (error) {
        console.error("Erreur lors du chargement des messages:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [user, currentPage, statusFilter, searchTerm]);
  
  // Mettre à jour les messages non lus quand on sélectionne un message
  useEffect(() => {
    const markAsRead = async () => {
      if (selectedMessage && selectedMessage.unread) {
        const success = await markMessagesAsRead(selectedMessage.id);
        if (success) {
          // Mettre à jour l'état local pour refléter que les messages sont lus
          setSelectedMessage(prev => {
            if (!prev) return null;
            return {
              ...prev,
              unread: false,
              conversations: prev.conversations.map(conv => ({
                ...conv,
                read: true
              }))
            };
          });
          
          // Mettre également à jour la liste des messages
          setMessages(prev => 
            prev.map(msg => 
              msg.id === selectedMessage.id 
                ? { ...msg, unread: false } 
                : msg
            )
          );
        }
      }
    };
    
    markAsRead();
  }, [selectedMessage]);
  
  // Faire défiler jusqu'au dernier message lorsqu'un nouveau message est ajouté
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMessage?.conversations]);
  
  // Gérer la recherche
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Réinitialiser à la première page
  };
  
  // Gérer le changement de filtre de statut
  const handleStatusFilterChange = (status: 'open' | 'resolved' | 'pending' | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1); // Réinitialiser à la première page
  };
  
  // Gérer la pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Gérer la sélection d'un message
  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
  };
  
  // Gérer l'envoi d'un nouveau message
  const handleSendMessage = async () => {
    if (!selectedMessage || !newMessage.trim()) return;
    
    try {
      const updatedMessage = await sendMessage(selectedMessage.customerId, newMessage);
      if (updatedMessage) {
        setSelectedMessage(updatedMessage);
        // Mettre également à jour la liste des messages
        setMessages(prev => 
          prev.map(msg => 
            msg.id === updatedMessage.id 
              ? updatedMessage 
              : msg
          )
        );
      }
      setNewMessage('');
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    }
  };
  
  // Gérer la touche Entrée pour envoyer un message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Gérer la mise à jour du statut d'un message
  const handleUpdateStatus = async (status: 'open' | 'resolved' | 'pending') => {
    if (!selectedMessage) return;
    
    try {
      const success = await updateMessageStatus(selectedMessage.id, status);
      if (success) {
        // Mettre à jour l'état local
        setSelectedMessage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status
          };
        });
        
        // Mettre également à jour la liste des messages
        setMessages(prev => 
          prev.map(msg => 
            msg.id === selectedMessage.id 
              ? { ...msg, status } 
              : msg
          )
        );
        
        // Mettre à jour les statistiques
        const statsData = await getMessagesStats();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };
  
  // Rendu des indicateurs de statut
  const renderStatusBadge = (status: 'open' | 'resolved' | 'pending') => {
    switch (status) {
      case 'open':
        return <Badge variant="default">En cours</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Résolu</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <PageHeader title="Messages" />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Liste des messages */}
        <div className="w-1/3 flex flex-col border-r border-gray-200">
          {/* En-tête avec statistiques */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-4 gap-2 mb-4">
              <Card className="p-2">
                <CardContent className="p-2">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-lg font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="p-2">
                <CardContent className="p-2">
                  <div className="text-xs text-gray-500">En cours</div>
                  <div className="text-lg font-bold">{stats.open}</div>
                </CardContent>
              </Card>
              <Card className="p-2">
                <CardContent className="p-2">
                  <div className="text-xs text-gray-500">Résolus</div>
                  <div className="text-lg font-bold">{stats.resolved}</div>
                </CardContent>
              </Card>
              <Card className="p-2">
                <CardContent className="p-2">
                  <div className="text-xs text-gray-500">En attente</div>
                  <div className="text-lg font-bold">{stats.pending}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher un message..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          
          {/* Filtres */}
          <div className="p-2 border-b border-gray-200">
            <div className="flex space-x-2">
              <Button 
                variant={statusFilter === 'all' ? "default" : "outline"}
                onClick={() => handleStatusFilterChange('all')}
                className="flex-1 text-xs"
              >
                Tous
              </Button>
              <Button 
                variant={statusFilter === 'open' ? "default" : "outline"}
                onClick={() => handleStatusFilterChange('open')}
                className="flex-1 text-xs"
              >
                En cours
              </Button>
              <Button 
                variant={statusFilter === 'resolved' ? "default" : "outline"}
                onClick={() => handleStatusFilterChange('resolved')}
                className="flex-1 text-xs"
              >
                Résolus
              </Button>
              <Button 
                variant={statusFilter === 'pending' ? "default" : "outline"}
                onClick={() => handleStatusFilterChange('pending')}
                className="flex-1 text-xs"
              >
                En attente
              </Button>
            </div>
          </div>
          
          {/* Liste des messages */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Chargement des messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Aucun message {searchTerm && 'correspondant à votre recherche'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <li 
                    key={message.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedMessage?.id === message.id ? 'bg-gray-50' : ''}`}
                    onClick={() => handleSelectMessage(message)}
                  >
                    <div className="px-4 py-3 flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${message.unread ? 'text-blue-600' : 'text-gray-900'}`}>
                            {message.customerName}
                          </p>
                          <span className="text-xs text-gray-500">
                            {message.minutes < 60 
                              ? `${message.minutes} min` 
                              : message.minutes < 1440 
                                ? `${Math.floor(message.minutes / 60)} h` 
                                : `${Math.floor(message.minutes / 1440)} j`}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-1 ${message.unread ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {message.lastMessage}
                        </p>
                      </div>
                      {message.unread && (
                        <span className="inline-block w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-2 border-t border-gray-200 flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} sur {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
        
        {/* Zone de conversation */}
        <div className="flex-1 flex flex-col">
          {selectedMessage ? (
            <>
              {/* En-tête de la conversation */}
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{selectedMessage.customerName}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {renderStatusBadge(selectedMessage.status)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={selectedMessage.status === 'resolved'}
                  >
                    <FiCheckCircle className="mr-1" />
                    Résolu
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateStatus('pending')}
                    disabled={selectedMessage.status === 'pending'}
                  >
                    <FiAlertCircle className="mr-1" />
                    En attente
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUpdateStatus('open')}
                    disabled={selectedMessage.status === 'open'}
                  >
                    <FiMessageSquare className="mr-1" />
                    Reprendre
                  </Button>
                </div>
              </div>
              
              {/* Corps de la conversation */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedMessage.conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`max-w-3/4 mb-4 ${
                      conv.sender === 'user' ? 'ml-auto' : 'mr-auto'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 ${
                        conv.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p>{conv.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {conv.time}
                    </p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Zone de saisie */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Écrivez votre message ici..."
                      className="resize-none"
                      rows={3}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                    />
                  </div>
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <FiSend className="mr-2" />
                    Envoyer
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-6">
                <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune conversation sélectionnée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sélectionnez une conversation dans la liste pour afficher les messages.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
