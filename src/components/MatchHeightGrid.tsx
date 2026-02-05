import React from 'react';
import { Grid, GridProps } from '@mui/material';

/**
 * MatchHeightGrid ensures all cards in a Grid row share the same height
 * This eliminates "jagged" rows and creates visual calm with aligned cards
 * 
 * Usage:
 * <MatchHeightGrid container spacing={2.5}>
 *   <Grid item xs={12} md={6}>
 *     <Card sx={{ height: '100%' }}>...</Card>
 *   </Grid>
 *   <Grid item xs={12} md={6}>
 *     <Card sx={{ height: '100%' }}>...</Card>
 *   </Grid>
 * </MatchHeightGrid>
 */
export const MatchHeightGrid: React.FC<GridProps> = ({ children, ...props }) => {
    return (
        <Grid
            container
            {...props}
            sx={{
                alignItems: 'stretch',
                '& > .MuiGrid-item': {
                    display: 'flex',
                    flexDirection: 'column',
                    '& > *': {
                        flex: 1,
                        width: '100%',
                    }
                },
                ...props.sx
            }}
        >
            {children}
        </Grid>
    );
};
