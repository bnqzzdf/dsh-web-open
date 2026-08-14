"HostPid=$HostPid" | Out-File -FilePath C:CodeSpacedsh-web-openargs-out.txt -Encoding UTF8
"Url=$Url" | Out-File -FilePath C:CodeSpacedsh-web-openargs-out.txt -Append -Encoding UTF8
"Raw args: $($args -join '|')" | Out-File -FilePath C:CodeSpacedsh-web-openargs-out.txt -Append -Encoding UTF8