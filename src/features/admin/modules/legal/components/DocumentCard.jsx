import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
const DocumentCard = ({ doc }) => <Card><CardContent>{doc?.title}</CardContent></Card>;
export default DocumentCard;