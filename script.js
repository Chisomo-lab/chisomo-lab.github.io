// Movie Hub Pro - base script
function doSearch(){var q=document.getElementById('searchInput').value.trim();if(!q){alert('Please enter search terms');return;}location.href='?s='+encodeURIComponent(q);}document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}});});});

/* Original script preserved below */
