import styled from "styled-components";

export const AdminNavbar = styled.div`
  background-color: transparent !important;
  .nav-link {
    color: lime !important;
    &:hover {
      background-color: lime !important;
      color: black !important;
    }
  }
  .active {
    background-color: rgba(0, 255, 0, 0.25) !important;
  }

  ul {
    list-style-type: none;
  }
`;

// .btn-terminal{
//     color: lime !important;
//     background-color: rgba(0, 255, 0, 0.05);
//     border-radius: 0;
//     margin: 5px;
//         &:hover{
//             background-color: lime !important;
//             color: black !important;
//         }

// }
// .selected{
//     background-color: rgba(0, 128, 0, 1);
// }

// .border-terminal{
//     border: 1px solid lime !important;
//     max-width: 100%;
//     overflow: auto;
// }
// .account-avatar {
//     height: 50px;
//     width: 50px;
// }

// .toast{
//     margin: 10px;
//     min-width: 250px;
//     opacity: 1 !important;
//     border-radius: 0;
//    background-color: #222;
// }

// .toast-header{
//     background-color: transparent;
// }
// .input-terminal{
//     background-color:  #222;
//     color: lime;
//     border: 1px solid lime;
//     margin: 0 2px;
//     padding: 5px;
// }

// .admin-account{
//     font-size: 20px;
//     img{
//         border: 1px solid lime !important;
//         height: 40px;
//         width: 40px;
//         margin-left: 5px;
//     }
// }

// .admin-websocket{
//     padding: 2px 5px;
//     margin: 0 5px ;

// }
// .admin-websocket-online{
//     border: 1px solid lime !important;
// }
// .admin-websocket-offline{
//     border: 1px solid red !important;
// }

// .admin-clickable {
//     transition: background-color 0.25s ;
//     &:hover {
//         background-color: rgba(0, 255, 0, 0.15) !important;
//     }
// }

// .account-banned{
//     border: 1px solid rgba(255, 0, 0, 1) !important;
//     background-color: rgba(255, 0, 0, 0.25);
// }

// .router-link{
//     text-decoration: none;
//     color: inherit;
//     &:hover{
//         color: inherit;

//     }
// }
