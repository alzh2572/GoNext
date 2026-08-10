# GoNext

Минимальное мобильное приложение на Expo SDK 54 (Expo Router + TypeScript) с React Native Paper.

Совместимо с Expo Go, поддерживающим SDK 54.

## Экран Home

- AppBar с названием **GoNext**
- Текст: «Привет, Алексей!»
- Кнопка «Нажми меня» — показывает Snackbar «Кнопка нажата»

## Запуск

```powershell
npm install
npm start
```

Затем отсканируйте QR-код в Expo Go на iPhone.

## iPhone hotspot при включённом Ethernet

Если ПК одновременно в Ethernet и в сети iPhone (режим модема), Expo часто показывает QR с IP Ethernet (`192.168.x.x`) — с телефона он недоступен. Задайте IP хотспота явно:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "172.20.10.3"
npx expo start --lan --port 8081
```

Проверить свой IP в сети iPhone:

```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '172.20.*' }
```

Подставьте полученный адрес вместо `172.20.10.3`.

Если LAN всё равно не открывается, запасной вариант — tunnel:

```powershell
npx expo start --tunnel
```

## Порт 8081

Проверить, свободен ли порт:

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
  Format-Table LocalAddress, LocalPort, State, OwningProcess -AutoSize
```

Если вывода нет — порт свободен. Если есть строки — порт занят; `OwningProcess` — PID процесса.

Узнать процесс:

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Get-Process -Id $_ | Select-Object Id, ProcessName, Path }
```

Освободить порт:

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

Либо в терминале с Metro нажмите `Ctrl+C`.
