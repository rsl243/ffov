import React from 'react';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  comparison?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  linkText: string;
  linkHref: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  comparison,
  icon,
  iconBgColor,
  linkText,
  linkHref
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-semibold">{value}</p>
            {comparison && (
              <p className="ml-2 text-sm font-medium text-green-600">{comparison}</p>
            )}
          </div>
          {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 ${iconBgColor} rounded-md`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <Link href={linkHref} className="text-sm font-medium text-blue-600 hover:text-blue-800">
          {linkText} →
        </Link>
      </div>
    </div>
  );
};

export default StatCard;
