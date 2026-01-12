
import React from 'react';

export const DOC_DEFINITIONS = [
  { name: 'Commercial Invoice', preparer: 'TATI', description: 'Official invoice for customs valuation' },
  { name: 'Packing List', preparer: 'TATI', description: 'Detailed package contents and weights' },
  { name: 'USMCA Certificate of Origin', preparer: 'TATI', description: 'Proof of US origin for duty benefits' },
  { name: 'EEI/AES Filing', preparer: 'TATI or US Broker', description: 'US government export record (ITN required)' },
  { name: 'Bill of Lading', preparer: 'Carrier', description: 'Contract between shipper and carrier' },
  { name: 'Carta Porte', preparer: 'MX Broker/Carrier', description: 'Mandatory Mexican digital transport document' },
  { name: 'Pedimento', preparer: 'MX Customs Broker', description: 'Mexican customs entry and duty payment' },
  { name: 'Safety Data Sheet (Spanish)', preparer: 'TATI', description: 'GHS compliant chemical safety info' },
  { name: 'Certificate of Analysis', preparer: 'TATI', description: 'Lab report confirming product specs' },
];

export const PEMEX_DOCS = [
  { name: 'PEMEX Gate Pass', preparer: 'PEMEX/TATI', description: 'Access authorization for PEMEX facilities' },
  { name: 'REPSE Registration', preparer: 'TATI', description: 'Contractor registry documentation' },
];

export const HAZMAT_DOCS = [
  { name: 'Dangerous Goods Declaration', preparer: 'TATI', description: 'Required hazmat transport form' },
  { name: 'Emergency Response Info', preparer: 'TATI', description: 'Spanish language emergency instructions' },
];

export const ICONS = {
  Shipment: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Add: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  Alert: () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
};
