import styled from 'styled-components';

export const ScreenStyled = styled.div`
    position: absolute;
    height: 100%;
    width: 100%;
    overflow: hidden;
`;

export const Wallpaper = styled.img`
    position: absolute;
    overflow: hidden;
    
    .landscape {
        width: 100%;
        height: auto;
    };
    .portrait {
        width: auto;
        height: 100%;
    };
`;

