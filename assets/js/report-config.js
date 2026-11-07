// Free preview of the State Government Trends Insights Report.
// Empty string: the preview button opens the request form.
// A path or URL: the preview button downloads that file.
window.SWP_REPORT_PREVIEW_URL = "assets/reports/statewatchpro-trends-sample.pdf";

(()=>{
  const url=(window.SWP_REPORT_PREVIEW_URL||"").trim();
  document.querySelectorAll("[data-report-preview]").forEach(a=>{
    if(url){a.href=url;a.setAttribute("download","statewatchpro-trends-sample.pdf");}
    else{a.href="reports.html#request-report";a.removeAttribute("download");}
  });
  const form=document.getElementById("report-request");
  if(!form) return;
  const mail=document.getElementById("req-mail");
  const sync=()=>{
    const name=form.querySelector("[name=name]").value.trim();
    const org=form.querySelector("[name=organization]").value.trim();
    const role=form.querySelector("[name=role]").value.trim();
    const type=form.querySelector("[name=type]").value.trim();
    const body=["Name: "+name,"Organization: "+org,"Role: "+role,"Type: "+type,"","Please send the full State Government Trends Insights Report."].join("\n");
    const href="mailto:hello@statewatchpro.com?subject="+encodeURIComponent("StateWatchPro full trends report")+"&body="+encodeURIComponent(body);
    if(mail) mail.href=href;
    return href;
  };
  form.addEventListener("input",sync);
  form.addEventListener("change",sync);
  form.addEventListener("submit",e=>{e.preventDefault();window.location.href=sync();});
  sync();
})();
