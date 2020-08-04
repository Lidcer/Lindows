import styled from 'styled-components';

export const BoxSelection = styled.div`
    position: fixed;
    background-color: transparentize($color: #0078d7, $amount: 0.5);
    z-index: 1;
    border: 1px solid #0078d7;
    user-select: none;
    pointer-events: none;
    overflow: hidden;
`;