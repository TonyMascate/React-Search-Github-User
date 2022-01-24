import React, { useState, useEffect, useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext =  React.createContext()

const GithubProvider = ({children}) =>  {

    const [githubUser, setGithubUser] = useState(mockUser)
    const [repos, setRepos] = useState(mockRepos)
    const [followers, setFollowers] = useState(mockFollowers)

    // requests et loading states
    const [requests, setRequests] = useState(0)
    const [maxRequests, setMaxRequests] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState({show: false, msg: ''})

    // check requests
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
        .then(({data: {rate}}) => {
            let {remaining, limit} = rate
            setRequests(remaining)
            setMaxRequests(limit)
            if(remaining === 0){
                toggleError(true, 'Vous avez depassé votre limite de requête')
            }
        })
        .catch((error) => {
            checkRequests()
            console.log(error);
        })
    }

    // search github user
    const searchGithubUser = async(user) => {
        toggleError()
        setLoading(true)
        const response = await axios(`${rootUrl}/users/${user}`)
        .catch(err => console.log(err));
        if(response){
            setGithubUser(response.data)
            const {followers_url, repos_url} = response.data

            await Promise.allSettled([axios(`${repos_url}?per_page=100`), axios(`${followers_url}?per_page=100`)])
            .then((results) => {
                const [repos, followers] = results
                const status = 'fulfilled'
                if(repos.status === status){
                    setRepos(repos.value.data)
                }
                if(followers.status === status){
                    setFollowers(followers.value.data)
                }
            }).catch(err => console.log(err))
        }else{
            toggleError(true, 'aucun utilisateur ne correspond à votre recherche')
        }
        checkRequests()
        setLoading(false)
    }

    const toggleError = (show= false, msg= '') => {
        setError({show, msg})
    }
    
    useEffect(checkRequests, [])
    useEffect(() => {
        searchGithubUser('TonyMascate')
    }, [])

    return(
        <GithubContext.Provider value={{
            githubUser,
            repos,
            followers,
            requests,
            maxRequests,
            error,
            loading,
            searchGithubUser
        }}>
            {children}
        </GithubContext.Provider>
    )
}

export const useGlobalContext = ()  => {
    return useContext(GithubContext)
}

export {GithubContext, GithubProvider}
