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

export const DesktopIconStyle = styled.div`
    position: fixed;
    width: 75px;
    z-index: 5;
    border: 1px solid transparent;
    &:hover {
        border: 1px solid rgba(255, 255, 255, 0.25);
        background-color: rgba(255, 255, 255, 0.05);
    }
    overflow: hidden;

`

export const DesktopIconCation = styled.div`
    color: white;
    text-align: center;
    text-shadow:
   -1px -1px 0 #000,  
    1px -1px 0 #000,
    -1px 1px 0 #000,
     1px 1px 0 #000;
`

export const DesktopIconRenamingInput = styled.input`
    background-color: white;
    outline: transparent;
    text-align: center;
    padding: 0 5px;
    color: black;
    border: 1px solid black;
    width: 100%;
`
