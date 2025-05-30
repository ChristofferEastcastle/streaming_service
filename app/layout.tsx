import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head>
          <title>Flix</title>
      </head>
      <body>
        <nav>
            <a href="/">Home</a>
            <a href="/browse">Browse</a>
        </nav>
      {children}
      </body>
    </>
  )
}
