import styled from 'styled-components';

export const AccountManagerPage = styled.div`
    position: absolute;
    border-top: 1pt solid yellow;
    border-radius: 10pt;
    padding: 5pt;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    box-shadow: 0 0 10pt black;
    min-width: 300pt;
    min-height: 300pt;
    max-width: 500pt;
    max-height: 500pt;
    overflow: auto;
    background-color : rgba(16, 16, 16, 1);
 `;
  
export const AccountManagerScrollabled = styled.div`
    max-height: 500px;
    overflow: auto;
`;
  
export const AccountManagerCard = styled.div`
    margin: 5pt;
    padding: 5pt;
    margin-top: 10pt;
    border-radius: 5pt;
    box-shadow: 0pt 0pt 5pt black;
  
    li {
      text-align: left;
    }
`;
  
export const AccountManagerCardAlt = styled.div`
    margin: 5pt;
    padding: 5pt;
    margin-top: 10pt;
    border-radius: 5pt;
    box-shadow: 0pt 0pt 5pt black;
    display: flex;
    flex-direction: row;
  
    img {
      cursor: pointer;
      margin: 5pt;
      height: 80pt;
      width: 80pt;
      border-radius: 5pt;
      border: 2pt solid black;
    }

    li {
      text-align: left;
    }
`;
  
export const AccountManagerInfo = styled.div`
  width: auto;
  flex: auto;
`;
  
export const AccountManagerAvatar = styled.div`
  display: flex;
  flex-direction: column;
`;

 export const AccountManager = styled.div`
   color: white;
   text-align: center;
   height:100%;
   background-color : rgba(16, 16, 16, 1);
   h1 {
     font-size: 25pt;
   }
 
   input {
     border: none;
     padding: 5pt;
     margin: 2pt;
     border-radius: 2pt;
     display: block;
     width: 100%;
   }
 
   a {
     color: lightblue;
   }
 
   button {
     border: none;
     padding: 5pt;
     margin: 1pt;
     border-radius: 2pt;
     display: inline-block;
   }
`;

export const InputDisabled = styled.input`
    background-color: rgb(185, 185, 185);
`