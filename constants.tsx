
import { Service } from './types';

export const SERVICES: Service[] = [
  {
    id: 'ration',
    title: 'Ration Card',
    description: 'Apply for new ration card or updates to existing household data.',
    icon: 'fa-solid fa-wheat-awn',
    color: 'bg-emerald-500',
    price: 150,
    helpLink: '/help/ration',
    requiresAddress: true,
    requiresPhoto: true,
    requiresSignature: true,
    requiresMotherName: true,
    requiresFatherName: true,
    allowAdditionalMembers: true
  },
  {
    id: 'pan',
    title: 'PAN Card',
    description: 'Fresh application or corrections for Permanent Account Number.',
    icon: 'fa-solid fa-address-card',
    color: 'bg-blue-600',
    price: 150,
    helpLink: '/help/pan',
    requiresPhoto: true,
    requiresSignature: true,
    requiresFatherName: true,
    requiresDob: true
  },
  {
    id: 'voter',
    title: 'Voter ID',
    description: 'Registration for new voters or transfer of electoral constituency.',
    icon: 'fa-solid fa-id-card-clip',
    color: 'bg-indigo-600',
    price: 50,
    helpLink: '/help/voter',
    requiresEpic: true,
    requiresAddress: true,
    requiresPhoto: true,
    requiresSignature: true,
    requiresFatherName: true
  },
  {
    id: 'naksha',
    title: 'नक्शा (Map)',
    description: 'Access official revenue maps for land surveys and documentation.',
    icon: 'fa-solid fa-map-location-dot',
    color: 'bg-teal-600',
    price: 200,
    helpLink: '/help/naksha',
    requiresLandDetails: true,
    requiresAddress: true
  },
  {
    id: 'mutation',
    title: 'दाखिल खारिज (Mutation)',
    description: 'Apply for land mutation and update name in official revenue records.',
    icon: 'fa-solid fa-file-signature',
    color: 'bg-lime-600',
    price: 350,
    helpLink: '/help/mutation',
    requiresLandDetails: true,
    requiresAddress: true,
    requiresFatherName: true
  },
  {
    id: 'income-cert',
    title: 'Income Certificate',
    description: 'Certification of annual household income for subsidies.',
    icon: 'fa-solid fa-money-bill-trend-up',
    color: 'bg-blue-500',
    price: 10,
    helpLink: '/help/income-cert',
    requiresAddress: true,
    requiresPhoto: true,
    requiresSignature: true,
    requiresMotherName: true,
    requiresFatherName: true
  },
  {
    id: 'tatkalin',
    title: 'Tatkalin Seva (Urgent)',
    description: 'Priority processing for Income, Caste, and Residential certificates.',
    icon: 'fa-solid fa-bolt-lightning',
    color: 'bg-orange-600',
    price: 100,
    helpLink: '/help/tatkalin',
    requiresAddress: true,
    requiresPhoto: true,
    requiresSignature: true,
    requiresFatherName: true
  }
];
