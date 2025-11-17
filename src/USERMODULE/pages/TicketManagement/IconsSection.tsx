import React from 'react';
import { Box, IconButton } from '@mui/material';
import { Person, Chat, Info } from '@mui/icons-material';

interface IconsSectionProps {
  onInfoClick: () => void;
  onPersonClick: () => void;
  onChatClick: () => void;
  chatCount?: number;
  activeContent?: 'customer' | 'info' | 'chat';
  
}

const IconsSection: React.FC<IconsSectionProps> = ({ onInfoClick, onPersonClick, onChatClick, chatCount = 0, activeContent }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 8px',
        backgroundColor: '#d1d9de',
        border: '1px solidrgb(117, 132, 144)',
        borderRadius: '8px',
        height: '100%',
        gap: '8px',
        justifyContent: 'flex-start',
      }}
    >
      {/* Info Icon */}
      <IconButton
        onClick={onInfoClick}
        sx={{
          width: '40px',
          height: '40px',
          backgroundColor: activeContent === 'info' ? '#2566b0' : '#f5f5f5',
          border: '1px solid #e0e0e0',
          '&:hover': {
            backgroundColor: activeContent === 'info' ? '#1565c0' : '#e0e0e0',
          },
        }}
      >
        <Info sx={{ 
          fontSize: '20px', 
          color: activeContent === 'info' ? 'white' : '#666' 
        }} />
      </IconButton>

      {/* Person Icon */}
      <IconButton
        onClick={onPersonClick}
        sx={{
          width: '40px',
          height: '40px',
          backgroundColor: activeContent === 'customer' ? '#2566b0' : '#f5f5f5',
          border: '1px solid #e0e0e0',
          '&:hover': {
            backgroundColor: activeContent === 'customer' ? '#1565c0' : '#e0e0e0',
          },
        }}
      >
        <Person sx={{ 
          fontSize: '20px', 
          color: activeContent === 'customer' ? 'white' : '#666' 
        }} />
      </IconButton>

   
      {/* <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onChatClick}
          sx={{
            width: '40px',
            height: '40px',
            backgroundColor: activeContent === 'chat' ? '#2566b0' : '#f5f5f5',
            border: '1px solid #e0e0e0',
            '&:hover': {
              backgroundColor: activeContent === 'chat' ? '#1565c0' : '#e0e0e0',
            },
          }}
        >
          <Chat sx={{ 
            fontSize: '20px', 
            color: activeContent === 'chat' ? 'white' : '#666' 
          }} />
        </IconButton>
        
  
        <Box
          sx={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            backgroundColor: '#2566b0',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            minWidth: '20px',
            padding: '0 2px',
          }}
        >
          {chatCount}
        </Box>
      </Box> */}

    </Box>
  );
};

export default IconsSection;
