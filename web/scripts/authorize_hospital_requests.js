// $('#back_btn').click(() => {
//   window.history.back();
// });


// const request_elements = new Map();
// let request_no = 0;

// function connect_to_websocket() {
//   hospital_authorization_ws = new WebSocket(hospital_authorization_ws_url);

//   hospital_authorization_ws.addEventListener('open', () => {
//     $('#connecting_container').replaceWith(cards_container);
//   });
  
//   hospital_authorization_ws.addEventListener('error', (event) => {
//     console.log('WebSocket error: ', event);
//   });
  
//   hospital_authorization_ws.addEventListener('close', (event) => {
//     cards_container.empty();
//     $('#cards_container').replaceWith(
//       $('<div/>')
//         .attr('id', 'connecting_container')
//         .addClass('d-flex align-items-center justify-content-center flex-grow-1')
//         .text('Connecting To Server')
//     );
//     setTimeout(connect_to_websocket, 1000);
//   });
  
//   hospital_authorization_ws.addEventListener('message', (event) => {
//     const { type, data } = JSON.parse(event.data);
  
//     if (type == 'hospital_authorization_request') {
//       const { authorization_status, ...user_data } = data;
//       const { wallet_address } = user_data;
  
//       const local_request_no = request_no;
  
//       const request_ele = (
//         $('<div/>')
//           .addClass('w-75 m-auto')
//           .append(
//             $('<div/>')
//               .addClass('card m-3 p-2')
//               .append(
//                   Object.entries(user_data).map(([key, value]) => {
//                     return (
//                       $('<div/>')
//                         .text(`${key}: ${value}`)
//                     );
//                   }),
//                   $('<div/>')
//                     .addClass('text-center')
//                     .append(
//                       $('<button/>')
//                         .text('Authorize')
//                         .addClass('btn btn-success m-2')
//                         .click(function() {
//                                 // modify
//                         }),
//                       $('<button/>')
//                         .text('Reject')         
//                         .addClass('btn btn-danger m-2')
//                         .click(function() {
//                                 // modify
//                         })    
//                     )
//               )
//           )
//       );
  
//       request_elements.set(local_request_no, request_ele);
//       request_no++;
  
//       $('#cards_container').append(
//         request_ele
//       );
//     }
//     else if (type == 'response_received') {
//       console.log(data);
//       const { request_no } = data;
  
//       if (request_elements.has(request_no)) {
//         request_elements.get(request_no).remove();
//         request_elements.delete(request_no);
//       }
//     }
//   });
// }


// const hospital_authorization_ws_url = location.protocol == 'https' ?
//   'wss://' : 'ws://'
//   + location.host + '/authorize_hospital_requests';

// // connect to websocket
// let cards_container = $('#cards_container').replaceWith(
//   $('<div/>')
//     .attr('id', 'connecting_container')
//     .addClass('d-flex align-items-center justify-content-center flex-grow-1')
//     .text('Connecting To Server')
// );
// let hospital_authorization_ws;
// connect_to_websocket();