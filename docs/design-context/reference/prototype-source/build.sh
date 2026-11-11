cd /home/claude/at
python3 hi_build.py >/dev/null
cat head.html style.css body.html js0.js hi.js js1.js js2.js js3.js js4.js js5.js js6.js js7.js js8.js js9.js js10.js js11.js js12.js js13.js js15.js js16.js js17.js js18.js js19.js js20.js js21.js js22.js js23.js js24.js js25.js js26.js js27.js js28.js js14.js > out.tmp
echo '</script>
</body>
</html>' >> out.tmp
mkdir -p /mnt/user-data/outputs
cp out.tmp /mnt/user-data/outputs/apnatown.html
wc -c /mnt/user-data/outputs/apnatown.html
