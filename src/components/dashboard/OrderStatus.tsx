import React from 'react';

interface OrderStatusProps {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  returned: number;
}

const OrderStatus: React.FC<OrderStatusProps> = ({
  pending,
  processing,
  shipped,
  delivered,
  returned
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">État des commandes</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xl font-bold">{pending}</div>
            <div className="text-sm text-gray-500">En attente</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xl font-bold">{processing}</div>
            <div className="text-sm text-gray-500">En préparation</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xl font-bold">{shipped}</div>
            <div className="text-sm text-gray-500">Expédiées</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xl font-bold">{delivered}</div>
            <div className="text-sm text-gray-500">Livrées</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xl font-bold">{returned}</div>
            <div className="text-sm text-gray-500">Retournées</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
