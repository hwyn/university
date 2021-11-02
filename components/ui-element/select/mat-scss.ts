import InputBase from '@mui/material/InputBase';
import { Theme } from '@mui/material/styles';
import { createStyles, withStyles } from '@mui/styles';

export const BootstrapInput = withStyles((theme: Theme) =>
  createStyles({
    root: {
      'label + &': { },
    },
    input: {
      borderRadius: 4,
      position: 'relative',
      backgroundColor: '#fafafa',
      border: '1px solid #ced4da',
      fontSize: 14,
      padding: '8px 24px 8px 12px',
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      '&:focus': {
        borderRadius: 4,
        borderColor: '#80bdff',
        boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
      },
    },
  }),
)(InputBase);

