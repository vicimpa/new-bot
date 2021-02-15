if(typeof window != 'undefined') {
  console.log('Browser')
}

else if(typeof global != 'undefined') {
  console.log('NodeJS')
}

else {
  console.log('Unknow interpreteer')
}