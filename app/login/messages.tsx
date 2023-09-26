'use client'

import { useSearchParams } from 'next/navigation'

import { BiSolidErrorCircle } from 'react-icons/bi'
import { BsQuestionCircleFill } from 'react-icons/bs'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


export default function Messages() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? null
  const message = searchParams?.get('message') ?? null
  return (
    <>
      {error && (
        <Alert variant="destructive"> 
          <BiSolidErrorCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert>
          <BsQuestionCircleFill className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            {message}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
