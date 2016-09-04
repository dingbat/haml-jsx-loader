const props = { href:"http://google.com", target:"_blank" }
const link = (~
  %a({...props} alt="Link") {linkTitle}
~);