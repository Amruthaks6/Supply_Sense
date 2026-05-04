import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, User, Package, Check, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DonationCard = ({ donation }) => {
  const navigate = useNavigate();

  const { 
    id,
    foodName, 
    category, 
    quantity, 
    availableServings,
    quantityUnit,
    expiryDate, 
    imageUrl, 
    pickupLocation, 
    donorName, 
    isAnonymous 
  } = donation;

  // Function to determine category badge color
  const getCategoryColor = (cat) => {
    const categories = {
      'Veg': 'bg-green-100 text-green-700 border-green-200',
      'Non-Veg': 'bg-red-100 text-red-700 border-red-200',
      'Packaged': 'bg-blue-100 text-blue-700 border-blue-200',
      'Dessert': 'bg-pink-100 text-pink-700 border-pink-200',
      'Juice': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return categories[cat] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group"
    >
      {/* Image Header */}
      <div className="relative h-48 w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
        <img 
          src={imageUrl} 
          alt={foodName} 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 z-20">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md ${getCategoryColor(category)}`}>
            {category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900 line-clamp-1" title={foodName}>
            {foodName}
          </h3>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 mt-4 flex-1">
          <div className="flex items-center text-sm text-gray-600">
            <Package className="w-4 h-4 mr-3 text-primary-500" />
            <span className="font-medium">Qty:</span> <span className="ml-1 text-gray-900">{availableServings} {quantityUnit}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-3 text-orange-500" />
            <span className="font-medium">Expires:</span> <span className="ml-1 text-gray-900">{expiryDate}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-3 text-blue-500" />
            <span className="truncate" title={pickupLocation}>{pickupLocation}</span>
          </div>

          <div className="flex items-center text-sm text-gray-600 pt-3 border-t border-gray-100 mt-4">
            <User className={`w-4 h-4 mr-3 ${isAnonymous ? 'text-gray-400' : 'text-purple-500'}`} />
            <span className={`font-medium ${isAnonymous ? 'italic text-gray-500' : 'text-gray-900'}`}>
              {isAnonymous ? 'Anonymous Donor' : donorName}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <motion.button 
            onClick={() => navigate(`/donation/${id}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <Info className="w-4 h-4" /> Details
          </motion.button>
          
          <motion.button 
            onClick={() => navigate(`/donation/${id}`)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 py-2.5 bg-primary-600 rounded-xl text-sm font-bold text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 transition-colors"
          >
            <Check className="w-4 h-4" /> Accept
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default DonationCard;
