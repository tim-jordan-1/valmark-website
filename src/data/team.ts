export interface TeamMember {
  initials: string;
  name: string;
  role: string;
  bio: string;
  photo?: string;
}

export const team: TeamMember[] = [
  {
    initials: 'VB',
    name: 'Valerio Bello',
    role: 'Owner | Waterproofer',
    bio: 'Valerio has over 10 years of experience in the waterproofing industry and holds a Certificate III in Waterproofing. Starting in domestic waterproofing, he has progressed into commercial and civil construction, with experience in bathrooms, laundries, balconies, retaining walls, polyurethane liquid membranes, PVC sheeting, podiums and torch-on systems. He brings a hands-on approach, strong attention to detail and a commitment to quality workmanship and reliable project outcomes.',
  },
  {
    initials: 'MR',
    name: 'Mark Raic',
    role: 'Owner | Civil Engineer',
    photo: '/uploads/mark-raic.png',
    bio: "Mark holds a Bachelor's Degree with Honours in Civil and Structural Engineering, as well as a degree in Business Management. He has worked across multiple large-scale construction projects and brings practical, hands-on experience in industrial waterproofing and remedial works. He focuses on practical solutions, quality workmanship and reliable project outcomes.",
  },
];
