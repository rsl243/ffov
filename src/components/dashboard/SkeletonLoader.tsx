import React from 'react';

interface SkeletonLoaderProps {
  type: 'card' | 'table' | 'status';
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="w-2/3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="p-3 bg-gray-200 rounded-md h-10 w-10"></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="overflow-x-auto">
              <div className="p-4">
                {Array.from({ length: count }).map((_, index) => (
                  <div key={index} className="flex space-x-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'status':
        return (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 animate-pulse">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {type === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {Array.from({ length: count }).map((_, index) => (
            <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
          ))}
        </div>
      ) : (
        renderSkeleton()
      )}
    </>
  );
};

export default SkeletonLoader;
